const pool = require('../config/db');
const { executeInSandbox, runAgainstTestCases, getExecutionCapabilities } = require('../services/codeExecutionService');

// 1. Run code against sample test cases or custom input
const runCode = async (req, res) => {
  try {
    const { questionId, language, sourceCode, customInput } = req.body;

    if (!language || !sourceCode) {
      return res.status(400).json({ success: false, message: 'Programming language and source code are required.' });
    }

    // Custom input run
    if (typeof customInput === 'string' && customInput.trim().length > 0) {
      const result = await executeInSandbox({
        language,
        sourceCode,
        inputData: customInput,
        timeoutMs: 4000
      });

      return res.status(200).json({
        success: true,
        isCustomInput: true,
        output: result.output,
        error: result.error,
        status: result.status,
        executionTimeMs: result.executionTimeMs
      });
    }

    // Default: run against sample test cases of the question
    const [codingProblem] = await pool.query(
      'SELECT id FROM coding_problems WHERE question_id = ?',
      [questionId]
    );

    if (codingProblem.length === 0) {
      return res.status(404).json({ success: false, message: 'Coding problem not found.' });
    }

    const [sampleCases] = await pool.query(
      'SELECT id, input_data, expected_output, is_sample FROM test_cases WHERE coding_problem_id = ? AND is_sample = 1 ORDER BY id ASC',
      [codingProblem[0].id]
    );

    if (sampleCases.length === 0) {
      // If no sample test cases defined, run with empty input
      const result = await executeInSandbox({
        language,
        sourceCode,
        inputData: '',
        timeoutMs: 4000
      });

      return res.status(200).json({
        success: true,
        isCustomInput: false,
        output: result.output,
        error: result.error,
        status: result.status,
        executionTimeMs: result.executionTimeMs
      });
    }

    const evaluation = await runAgainstTestCases({
      language,
      sourceCode,
      testCases: sampleCases
    });

    return res.status(200).json({
      success: true,
      isCustomInput: false,
      ...evaluation
    });
  } catch (error) {
    console.error('Error running code:', error);
    return res.status(500).json({ success: false, message: 'Server error during code execution.' });
  }
};

// 2. Submit code for a specific problem inside an attempt
const submitProblemCode = async (req, res) => {
  try {
    const { attemptId, questionId, language, sourceCode } = req.body;

    if (!attemptId || !questionId || !language || !sourceCode) {
      return res.status(400).json({ success: false, message: 'attemptId, questionId, language, and sourceCode are required.' });
    }

    // Fetch problem & all test cases (sample + hidden)
    const [codingProblem] = await pool.query(
      'SELECT cp.id, q.marks FROM coding_problems cp JOIN questions q ON q.id = cp.question_id WHERE cp.question_id = ?',
      [questionId]
    );

    if (codingProblem.length === 0) {
      return res.status(404).json({ success: false, message: 'Coding problem not found.' });
    }

    const problem = codingProblem[0];
    const [allTestCases] = await pool.query(
      'SELECT id, input_data, expected_output, is_sample FROM test_cases WHERE coding_problem_id = ? ORDER BY id ASC',
      [problem.id]
    );

    const evalResult = await runAgainstTestCases({
      language,
      sourceCode,
      testCases: allTestCases
    });

    const maxMarks = Number(problem.marks) || 50;
    let earnedMarks = 0;
    let finalStatus = 'failed';

    if (evalResult.serviceUnavailable) {
      finalStatus = 'pending';
      earnedMarks = 0;
    } else if (evalResult.allPassed) {
      finalStatus = 'passed';
      earnedMarks = maxMarks;
    } else {
      const passRate = evalResult.totalCount > 0 ? (evalResult.passedCount / evalResult.totalCount) : 0;
      earnedMarks = Math.round(maxMarks * passRate * 100) / 100;
      finalStatus = evalResult.passedCount > 0 ? 'failed' : (evalResult.results[0]?.status || 'failed');
    }

    // Save into code_submissions
    const [existing] = await pool.query(
      'SELECT id FROM code_submissions WHERE attempt_id = ? AND question_id = ?',
      [attemptId, questionId]
    );

    if (existing.length > 0) {
      await pool.query(`
        UPDATE code_submissions
        SET programming_language = ?, source_code = ?, execution_status = ?, score = ?, submitted_at = NOW()
        WHERE id = ?
      `, [language, sourceCode, finalStatus, earnedMarks, existing[0].id]);
    } else {
      await pool.query(`
        INSERT INTO code_submissions (attempt_id, question_id, programming_language, source_code, execution_status, score)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [attemptId, questionId, language, sourceCode, finalStatus, earnedMarks]);
    }

    return res.status(200).json({
      success: true,
      message: 'Code submitted and evaluated successfully.',
      score: earnedMarks,
      maxMarks,
      passedCount: evalResult.passedCount,
      totalCount: evalResult.totalCount,
      executionStatus: finalStatus,
      serviceUnavailable: evalResult.serviceUnavailable,
      errorMessage: evalResult.error,
      // Only return sample test case details in response
      sampleResults: evalResult.results ? evalResult.results.filter(r => r.isSample) : []
    });
  } catch (error) {
    console.error('Error in submitProblemCode:', error);
    return res.status(500).json({ success: false, message: 'Server error during code evaluation.' });
  }
};

// 3. Execution capabilities (what compilers are installed)
const getCapabilities = (req, res) => {
  return res.status(200).json({
    success: true,
    capabilities: getExecutionCapabilities()
  });
};

module.exports = {
  runCode,
  submitProblemCode,
  getCapabilities
};
