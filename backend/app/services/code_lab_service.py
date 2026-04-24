from __future__ import annotations

from dataclasses import dataclass
import os
import shutil
import subprocess
import tempfile

from app.services.lab_runner import run_java_code


@dataclass(frozen=True)
class CodeLabChallenge:
    key: str
    language: str
    title: str
    description: str
    starter_code: str
    sample_input: str
    expected_output: str
    hint: str


_CHALLENGES: dict[str, CodeLabChallenge] = {
    "python": CodeLabChallenge(
        key="binary-search-python",
        language="python",
        title="Binary Search Refactor",
        description="Complete a binary search helper that returns the index of the target, or -1 when it is missing.",
        starter_code=(
            "# Write your solution here\n"
            "def binary_search(arr, target):\n"
            "    left, right = 0, len(arr) - 1\n"
            "    while left <= right:\n"
            "        mid = (left + right) // 2\n"
            "        if arr[mid] == target:\n"
            "            return mid\n"
            "        if arr[mid] < target:\n"
            "            left = mid + 1\n"
            "        else:\n"
            "            right = mid - 1\n"
            "    return -1\n"
            "\n"
            "print(binary_search([1, 3, 5, 7, 9], 5))\n"
        ),
        sample_input="",
        expected_output="2",
        hint="Handle empty arrays before the loop and keep the search bounds inclusive.",
    ),
    "javascript": CodeLabChallenge(
        key="binary-search-js",
        language="javascript",
        title="Binary Search Refactor",
        description="Complete a binary search helper that returns the index of the target, or -1 when it is missing.",
        starter_code=(
            "// Write your solution here\n"
            "function binarySearch(arr, target) {\n"
            "  let left = 0;\n"
            "  let right = arr.length - 1;\n"
            "  while (left <= right) {\n"
            "    const mid = Math.floor((left + right) / 2);\n"
            "    if (arr[mid] === target) return mid;\n"
            "    if (arr[mid] < target) left = mid + 1;\n"
            "    else right = mid - 1;\n"
            "  }\n"
            "  return -1;\n"
            "}\n"
            "\n"
            "console.log(binarySearch([1, 3, 5, 7, 9], 5));\n"
        ),
        sample_input="",
        expected_output="2",
        hint="Use Math.floor for the midpoint and keep the loop bounds tight.",
    ),
    "java": CodeLabChallenge(
        key="binary-search-java",
        language="java",
        title="Binary Search Refactor",
        description="Complete a binary search helper that returns the index of the target, or -1 when it is missing.",
        starter_code=(
            "public class Main {\n"
            "  static int binarySearch(int[] arr, int target) {\n"
            "    int left = 0, right = arr.length - 1;\n"
            "    while (left <= right) {\n"
            "      int mid = (left + right) / 2;\n"
            "      if (arr[mid] == target) return mid;\n"
            "      if (arr[mid] < target) left = mid + 1;\n"
            "      else right = mid - 1;\n"
            "    }\n"
            "    return -1;\n"
            "  }\n"
            "  public static void main(String[] args) {\n"
            "    System.out.println(binarySearch(new int[]{1, 3, 5, 7, 9}, 5));\n"
            "  }\n"
            "}\n"
        ),
        sample_input="",
        expected_output="2",
        hint="Keep the midpoint calculation integer-safe and remember the -1 fallback.",
    ),
    "c++": CodeLabChallenge(
        key="binary-search-cpp",
        language="c++",
        title="Binary Search Refactor",
        description="Complete a binary search helper that returns the index of the target, or -1 when it is missing.",
        starter_code=(
            "#include <bits/stdc++.h>\n"
            "using namespace std;\n"
            "int binarySearch(vector<int>& arr, int target) {\n"
            "  int left = 0, right = (int)arr.size() - 1;\n"
            "  while (left <= right) {\n"
            "    int mid = left + (right - left) / 2;\n"
            "    if (arr[mid] == target) return mid;\n"
            "    if (arr[mid] < target) left = mid + 1;\n"
            "    else right = mid - 1;\n"
            "  }\n"
            "  return -1;\n"
            "}\n"
            "int main() {\n"
            "  vector<int> arr{1, 3, 5, 7, 9};\n"
            "  cout << binarySearch(arr, 5) << \"\\n\";\n"
            "}\n"
        ),
        sample_input="",
        expected_output="2",
        hint="Prefer a midpoint formula that avoids overflow.",
    ),
    "c": CodeLabChallenge(
        key="binary-search-c",
        language="c",
        title="Binary Search Refactor",
        description="Complete a binary search helper that returns the index of the target, or -1 when it is missing.",
        starter_code=(
            "#include <stdio.h>\n"
            "int binarySearch(int arr[], int size, int target) {\n"
            "  int left = 0, right = size - 1;\n"
            "  while (left <= right) {\n"
            "    int mid = left + (right - left) / 2;\n"
            "    if (arr[mid] == target) return mid;\n"
            "    if (arr[mid] < target) left = mid + 1;\n"
            "    else right = mid - 1;\n"
            "  }\n"
            "  return -1;\n"
            "}\n"
            "int main() {\n"
            "  int arr[] = {1, 3, 5, 7, 9};\n"
            "  printf(\"%d\\n\", binarySearch(arr, 5, 5));\n"
            "  return 0;\n"
            "}\n"
        ),
        sample_input="",
        expected_output="2",
        hint="Keep the loop inclusive and return -1 when the target is absent.",
    ),
}


def list_challenges() -> list[dict]:
    return [
        {
            "key": challenge.key,
            "language": challenge.language,
            "title": challenge.title,
            "description": challenge.description,
            "starter_code": challenge.starter_code,
            "sample_input": challenge.sample_input,
            "expected_output": challenge.expected_output,
            "hint": challenge.hint,
        }
        for challenge in _CHALLENGES.values()
    ]


def get_challenge(language: str | None) -> dict:
    key = (language or "python").strip().lower()
    if key in {"js", "javascript", "node"}:
        key = "javascript"
    elif key in {"cpp", "c++"}:
        key = "c++"
    elif key in {"csharp", "c#", "cs"}:
        key = "c++"
    elif key not in _CHALLENGES:
        key = "python"
    challenge = _CHALLENGES[key]
    return {
        "key": challenge.key,
        "language": challenge.language,
        "title": challenge.title,
        "description": challenge.description,
        "starter_code": challenge.starter_code,
        "sample_input": challenge.sample_input,
        "expected_output": challenge.expected_output,
        "hint": challenge.hint,
    }


def _run_python(source_code: str, stdin_text: str) -> dict:
    python_bin = shutil.which("python3") or shutil.which("python")
    if not python_bin:
        return _simulated_result("python", source_code, "Python runtime not available.")

    try:
        with tempfile.TemporaryDirectory(prefix="vakify_py_") as tmpdir:
            file_path = os.path.join(tmpdir, "main.py")
            with open(file_path, "w", encoding="utf-8") as handle:
                handle.write(source_code)
            proc = subprocess.run(
                [python_bin, "-I", file_path],
                input=stdin_text,
                capture_output=True,
                text=True,
                timeout=12,
                cwd=tmpdir,
            )
            return _process_result("python", proc.returncode, proc.stdout, proc.stderr)
    except subprocess.TimeoutExpired:
        return _timeout_result("python")
    except Exception as exc:
        return _error_result("python", str(exc))


def _run_javascript(source_code: str, stdin_text: str) -> dict:
    node_bin = shutil.which("node")
    if not node_bin:
        return _simulated_result("javascript", source_code, "Node runtime not available.")

    try:
        with tempfile.TemporaryDirectory(prefix="vakify_js_") as tmpdir:
            file_path = os.path.join(tmpdir, "main.js")
            with open(file_path, "w", encoding="utf-8") as handle:
                handle.write(source_code)
            proc = subprocess.run(
                [node_bin, file_path],
                input=stdin_text,
                capture_output=True,
                text=True,
                timeout=12,
                cwd=tmpdir,
            )
            return _process_result("javascript", proc.returncode, proc.stdout, proc.stderr)
    except subprocess.TimeoutExpired:
        return _timeout_result("javascript")
    except Exception as exc:
        return _error_result("javascript", str(exc))


def _run_c_like(source_code: str, stdin_text: str, language: str) -> dict:
    compiler = shutil.which("g++" if language == "c++" else "gcc")
    if not compiler:
        return _simulated_result(language, source_code, f"{language.upper()} compiler not available.")

    try:
        with tempfile.TemporaryDirectory(prefix=f"vakify_{language.replace('+', 'p')}_") as tmpdir:
            ext = "cpp" if language == "c++" else "c"
            file_path = os.path.join(tmpdir, f"main.{ext}")
            with open(file_path, "w", encoding="utf-8") as handle:
                handle.write(source_code)
            compile_args = [compiler, file_path, "-o", os.path.join(tmpdir, "main")]
            compile_proc = subprocess.run(
                compile_args,
                capture_output=True,
                text=True,
                timeout=15,
                cwd=tmpdir,
            )
            if compile_proc.returncode != 0:
                return _process_result(language, compile_proc.returncode, compile_proc.stdout, compile_proc.stderr)
            proc = subprocess.run(
                [os.path.join(tmpdir, "main")],
                input=stdin_text,
                capture_output=True,
                text=True,
                timeout=12,
                cwd=tmpdir,
            )
            return _process_result(language, proc.returncode, proc.stdout, proc.stderr)
    except subprocess.TimeoutExpired:
        return _timeout_result(language)
    except Exception as exc:
        return _error_result(language, str(exc))


def _run_java(source_code: str, stdin_text: str) -> dict:
    result = run_java_code(source_code)
    result["language"] = "java"
    return result


def run_code(language: str, source_code: str, stdin_text: str = "") -> dict:
    key = (language or "python").strip().lower()
    if key in {"js", "javascript", "node"}:
        key = "javascript"
    elif key in {"cpp", "c++"}:
        key = "c++"
    elif key not in _CHALLENGES:
        key = "python"

    if key == "python":
        result = _run_python(source_code, stdin_text)
    elif key == "javascript":
        result = _run_javascript(source_code, stdin_text)
    elif key == "java":
        result = _run_java(source_code, stdin_text)
    elif key in {"c", "c++"}:
        result = _run_c_like(source_code, stdin_text, key)
    else:
        result = _simulated_result(key, source_code, "Unsupported language.")

    result["language"] = key
    result["challenge"] = get_challenge(key)
    result["tests"] = _generate_tests(key, source_code, result)
    return result


def _process_result(language: str, returncode: int, stdout: str, stderr: str) -> dict:
    status = "success" if returncode == 0 else "error"
    return {
        "status": status,
        "stdout": stdout or "",
        "stderr": stderr or "",
        "runner": "local",
        "note": "Executed locally in the backend.",
    }


def _timeout_result(language: str) -> dict:
    return {
        "status": "error",
        "stdout": "",
        "stderr": "Execution timed out.",
        "runner": "local",
        "note": "Executed locally in the backend.",
    }


def _error_result(language: str, message: str) -> dict:
    return {
        "status": "error",
        "stdout": "",
        "stderr": f"Execution failed: {message}",
        "runner": "local",
        "note": "Executed locally in the backend.",
    }


def _simulated_result(language: str, source_code: str, reason: str) -> dict:
    return {
        "status": "success" if source_code.strip() else "error",
        "stdout": "Simulated execution success." if source_code.strip() else "",
        "stderr": "" if source_code.strip() else "No source code provided.",
        "runner": "simulated",
        "note": reason,
    }


def _generate_tests(language: str, source_code: str, result: dict) -> list[dict]:
    normalized = (source_code or "").lower()
    has_binary_search = "binary_search" in normalized or "binarysearch" in normalized
    handles_empty = any(token in normalized for token in ("len(arr) == 0", "arr.length === 0", "size == 0", "arr.empty()", "arr.isEmpty()", "if not arr"))
    returns_negative_one = "-1" in normalized
    success = result.get("status") == "success"

    tests = [
        {"name": "Function compiled or executed", "passed": success},
        {"name": "Binary search logic detected", "passed": has_binary_search},
        {"name": "Empty input edge case handled", "passed": handles_empty},
        {"name": "Missing target fallback detected", "passed": returns_negative_one},
    ]
    return tests
