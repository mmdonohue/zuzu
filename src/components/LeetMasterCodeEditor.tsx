import React, { useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { dracula } from "@codesandbox/sandpack-themes";
import { Box, Button, Chip, Typography, Paper } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type TestCase = {
  input: string;
  expected_output: string;
};

type ProblemJson = {
  title: string;
  description: string;
  test_cases: TestCase[];
  starter_code: string;
  solution_code: string;
  hints: string[];
  constraints: string[];
  keywords: string[];
  time_complexity: string;
  space_complexity: string;
};

type CodeEditorProps = {
  problemJson: ProblemJson;
  difficulty: string;
  onComplete?: () => void;
};

const NODE_VERSION = "20.15.0";

const RunButton: React.FC = () => {
  const { sandpack } = useSandpack();
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    // Trigger code execution by updating the code
    sandpack.updateFile("/index.js", sandpack.files["/index.js"].code);
    setTimeout(() => setIsRunning(false), 500);
  };

  return (
    <Button
      variant="contained"
      startIcon={<PlayArrowIcon />}
      onClick={handleRun}
      disabled={isRunning}
      sx={{
        backgroundColor: "#2e7d32",
        "&:hover": { backgroundColor: "#1b5e20" },
      }}
    >
      Run Tests
    </Button>
  );
};

const LeetMasterCodeEditor: React.FC<CodeEditorProps> = ({
  problemJson,
  difficulty,
  onComplete,
}) => {
  const [allTestsPassed, setAllTestsPassed] = useState(false);

  // Generate the test runner code
  const generateTestCode = (): string => {
    const testCasesCode = problemJson.test_cases
      .map((tc, index) => {
        return `  // Test Case ${index + 1}
  try {
    const input = ${tc.input};
    const expected = ${tc.expected_output};
    const result = runSolution(input);

    if (JSON.stringify(result) === JSON.stringify(expected)) {
      console.log('✅ Test Case ${index + 1}: PASSED');
      passed++;
    } else {
      console.log('❌ Test Case ${index + 1}: FAILED');
      console.log('  Input:', JSON.stringify(input));
      console.log('  Expected:', JSON.stringify(expected));
      console.log('  Got:', JSON.stringify(result));
      failed++;
    }
  } catch (error) {
    console.log('❌ Test Case ${index + 1}: ERROR - ' + error.message);
    failed++;
  }`;
      })
      .join("\n\n");

    // Build problem header comments (without solution)
    const headerComments = `/*
 * ============================================
 * ${problemJson.title}
 * Difficulty: ${difficulty.toUpperCase()}
 * ============================================
 *
 * DESCRIPTION:
 * ${problemJson.description.split("\n").join("\n * ")}
 *
 * CONSTRAINTS:
${problemJson.constraints.map((c) => ` * - ${c}`).join("\n")}
 *
 * COMPLEXITY:
 * Time: ${problemJson.time_complexity}
 * Space: ${problemJson.space_complexity}
 *
 * KEYWORDS:
 * ${problemJson.keywords.join(", ")}
 *
 * TEST CASES:
${problemJson.test_cases.map((tc, i) => ` * ${i + 1}. Input: ${tc.input} | Expected: ${tc.expected_output}`).join("\n")}
 *
 * HINTS:
${problemJson.hints.map((h, i) => ` * ${i + 1}. ${h}`).join("\n")}
 * ============================================
 */

`;

    // Build solution comments (placed at bottom)
    const solutionComments = `

// ============================================
// SOLUTION (SCROLL DOWN AT YOUR OWN RISK!)
// ============================================
/*
${problemJson.solution_code
  .split("\n")
  .map((line) => ` * ${line}`)
  .join("\n")}
 */`;

    return `${headerComments}${problemJson.starter_code}

// ============================================
// TEST RUNNER (DO NOT MODIFY)
// ============================================
function runTests() {
  let passed = 0;
  let failed = 0;

  console.clear();
  console.log('Node.js v${NODE_VERSION}');
  console.log('Running ${problemJson.test_cases.length} test case(s)...\\n');

${testCasesCode}

  console.log('\\n' + '='.repeat(40));
  console.log(\`Results: \${passed} passed, \${failed} failed\`);
  console.log('='.repeat(40));

  if (failed === 0) {
    console.log('\\n🎉 All tests passed! Great job!');
    return true;
  } else {
    console.log('\\n💡 Keep trying! You can do it!');
    return false;
  }
}

// Run tests when this code is executed
runTests();
${solutionComments}
`;
  };

  const files = {
    "/index.js": generateTestCode(),
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.75rem",
          }}
        >
          Code Editor
        </Typography>
        {allTestsPassed && (
          <Chip
            icon={<CheckCircleIcon />}
            label="All Tests Passed"
            color="success"
            size="small"
          />
        )}
      </Box>

      <Paper
        sx={{
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <SandpackProvider
          template="vanilla"
          files={files}
          theme={dracula}
          customSetup={{
            entry: "/index.js",
          }}
          options={{
            autorun: false,
          }}
        >
          <SandpackLayout>
            <SandpackCodeEditor
              style={{
                height: "500px",
                fontSize: "14px",
                width: "50%",
                flex: "0 0 50%",
              }}
              showTabs={false}
              showLineNumbers={true}
            />
            <Box
              sx={{
                width: "50%",
                flex: "0 0 50%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#1e1e1e",
              }}
            >
              <Box
                sx={{
                  p: 1,
                  backgroundColor: "#252526",
                  borderBottom: "1px solid #3e3e42",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#858585",
                    fontFamily: "monospace",
                    fontSize: "11px",
                  }}
                >
                  Node.js v{NODE_VERSION}
                </Typography>
                <RunButton />
              </Box>
              <SandpackConsole
                style={{
                  height: "460px",
                  backgroundColor: "#1e1e1e",
                  color: "#d4d4d4",
                  fontFamily: "monospace",
                }}
                showHeader={false}
                showSyntaxError={true}
              />
            </Box>
          </SandpackLayout>
        </SandpackProvider>
      </Paper>

      <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Edit the <code>runSolution()</code> function above and click "Run
          Tests" to execute.
        </Typography>
      </Box>
    </Box>
  );
};

export default LeetMasterCodeEditor;
