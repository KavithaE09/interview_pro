const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

// Temporary sandbox directory
const SANDBOX_DIR = path.join(__dirname, '../sandbox_temp');
if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

// Check availability of compilers/interpreters on startup
const checkCommandAvailable = (cmd) => {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const hasPython = checkCommandAvailable('python') || checkCommandAvailable('py');
const pythonCmd = checkCommandAvailable('python') ? 'python' : (checkCommandAvailable('py') ? 'py' : null);
const hasNode = checkCommandAvailable('node');
const hasGcc = checkCommandAvailable('gcc');
const hasJavac = checkCommandAvailable('javac');

/**
 * Execute candidate code in an isolated child process.
 * Never runs code in the main process thread.
 */
const executeInSandbox = async ({ language, sourceCode, inputData = '', timeoutMs = 4000 }) => {
  const lang = (language || '').toLowerCase().trim();
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const runDir = path.join(SANDBOX_DIR, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const cleanup = () => {
    try {
      if (fs.existsSync(runDir)) {
        fs.rmSync(runDir, { recursive: true, force: true });
      }
    } catch (e) {
      // ignore cleanup errors
    }
  };

  try {
    let executeCmd = '';
    let executeArgs = [];
    let sourceFilePath = '';

    if (lang === 'python' || lang === 'py') {
      if (!pythonCmd) {
        return {
          status: 'service_unavailable',
          output: '',
          error: 'Python execution service is not configured on this server.',
          executionTimeMs: 0
        };
      }
      sourceFilePath = path.join(runDir, 'solution.py');
      fs.writeFileSync(sourceFilePath, sourceCode, 'utf-8');
      executeCmd = pythonCmd;
      executeArgs = [sourceFilePath];
    } else if (lang === 'javascript' || lang === 'js') {
      if (!hasNode) {
        return {
          status: 'service_unavailable',
          output: '',
          error: 'Node.js execution service is not available.',
          executionTimeMs: 0
        };
      }
      sourceFilePath = path.join(runDir, 'solution.js');
      fs.writeFileSync(sourceFilePath, sourceCode, 'utf-8');
      executeCmd = 'node';
      executeArgs = [sourceFilePath];
    } else if (lang === 'c') {
      if (!hasGcc) {
        return {
          status: 'service_unavailable',
          output: '',
          error: 'C compiler (gcc) is not installed on the server. Please write and test in Python or JavaScript, or contact the assessment administrator.',
          executionTimeMs: 0
        };
      }
      sourceFilePath = path.join(runDir, 'solution.c');
      const binPath = path.join(runDir, 'solution.exe');
      fs.writeFileSync(sourceFilePath, sourceCode, 'utf-8');

      // Compile step
      try {
        execSync(`gcc "${sourceFilePath}" -o "${binPath}"`, { timeout: 6000, cwd: runDir });
      } catch (compileErr) {
        return {
          status: 'compilation_error',
          output: '',
          error: compileErr.stderr ? compileErr.stderr.toString() : compileErr.message,
          executionTimeMs: 0
        };
      }
      executeCmd = binPath;
      executeArgs = [];
    } else if (lang === 'java') {
      if (!hasJavac) {
        return {
          status: 'service_unavailable',
          output: '',
          error: 'Java Development Kit (javac) is not installed on the server. Please write and test in Python or JavaScript, or contact the administrator.',
          executionTimeMs: 0
        };
      }
      sourceFilePath = path.join(runDir, 'Solution.java');
      fs.writeFileSync(sourceFilePath, sourceCode, 'utf-8');

      // Compile step
      try {
        execSync(`javac "${sourceFilePath}"`, { timeout: 8000, cwd: runDir });
      } catch (compileErr) {
        return {
          status: 'compilation_error',
          output: '',
          error: compileErr.stderr ? compileErr.stderr.toString() : compileErr.message,
          executionTimeMs: 0
        };
      }
      executeCmd = 'java';
      executeArgs = ['-cp', runDir, 'Solution'];
    } else {
      return {
        status: 'service_unavailable',
        output: '',
        error: `Language '${language}' is not supported. Supported: Python, JavaScript, Java, C.`,
        executionTimeMs: 0
      };
    }

    // Run the compiled/script program in child_process
    const startTime = Date.now();
    return await new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const child = spawn(executeCmd, executeArgs, {
        cwd: runDir,
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
        windowsHide: true
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      if (child.stdin) {
        child.stdin.on('error', () => {});
        if (inputData) {
          child.stdin.write(inputData);
        }
        child.stdin.end();
      }

      child.stdout.on('data', (data) => {
        if (stdout.length < 50000) {
          stdout += data.toString();
        }
      });

      child.stderr.on('data', (data) => {
        if (stderr.length < 50000) {
          stderr += data.toString();
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        cleanup();
        resolve({
          status: 'runtime_error',
          output: stdout,
          error: err.message,
          executionTimeMs: Date.now() - startTime
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        cleanup();
        const executionTimeMs = Date.now() - startTime;

        if (isTimedOut) {
          return resolve({
            status: 'time_limit_exceeded',
            output: stdout,
            error: `Time limit exceeded (${timeoutMs / 1000}s). Make sure your solution does not have an infinite loop.`,
            executionTimeMs
          });
        }

        if (code !== 0 && !stdout.trim()) {
          return resolve({
            status: 'runtime_error',
            output: stdout,
            error: stderr || `Process exited with code ${code}`,
            executionTimeMs
          });
        }

        return resolve({
          status: 'success',
          output: stdout.trim(),
          error: stderr.trim(),
          executionTimeMs
        });
      });
    });
  } catch (error) {
    cleanup();
    return {
      status: 'runtime_error',
      output: '',
      error: error.message,
      executionTimeMs: 0
    };
  }
};

/**
 * Compare program output with expected output, normalizing whitespace and line endings.
 */
const normalizeOutput = (str = '') => {
  return str
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
};

/**
 * Execute against test cases
 */
const runAgainstTestCases = async ({ language, sourceCode, testCases }) => {
  const results = [];
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const execResult = await executeInSandbox({
      language,
      sourceCode,
      inputData: tc.input_data || '',
      timeoutMs: 4000
    });

    if (execResult.status === 'service_unavailable') {
      return {
        serviceUnavailable: true,
        error: execResult.error,
        results: []
      };
    }

    const actual = normalizeOutput(execResult.output);
    const expected = normalizeOutput(tc.expected_output);
    const passed = (execResult.status === 'success' && actual === expected);

    if (passed) passedCount++;

    results.push({
      testCaseIndex: i + 1,
      isSample: Boolean(tc.is_sample),
      // Hide input & expected for hidden test cases if failed or hidden
      inputData: tc.is_sample ? tc.input_data : '(Hidden Test Case Input)',
      expectedOutput: tc.is_sample ? tc.expected_output : '(Hidden Expected Output)',
      actualOutput: tc.is_sample ? execResult.output : (passed ? 'Output matches expected' : 'Output did not match expected'),
      status: passed ? 'passed' : (execResult.status === 'success' ? 'failed' : execResult.status),
      error: execResult.error,
      executionTimeMs: execResult.executionTimeMs
    });
  }

  return {
    serviceUnavailable: false,
    totalCount: testCases.length,
    passedCount,
    allPassed: passedCount === testCases.length,
    results
  };
};

module.exports = {
  executeInSandbox,
  runAgainstTestCases,
  getExecutionCapabilities: () => ({
    python: Boolean(pythonCmd),
    javascript: hasNode,
    c: hasGcc,
    java: hasJavac
  })
};
