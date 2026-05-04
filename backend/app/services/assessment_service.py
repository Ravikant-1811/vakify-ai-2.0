from __future__ import annotations

from dataclasses import dataclass


SUPPORTED_LANGUAGES = {"python", "javascript", "java", "c++", "c"}


@dataclass(frozen=True)
class QuestionTemplate:
    question_id: str
    prompt: str
    options: list[str]
    correct_index: int
    topic: str


LANGUAGE_FACTS = {
    "python": {
        "display": "Python",
        "comment": "#",
        "function": "def",
        "print": "print()",
        "input": "input()",
        "collection": "list",
        "exception": "try/except",
        "import": "import module",
        "unique": "set",
        "loop": "for",
        "debug": "Run a tiny example and read the error carefully",
    },
    "javascript": {
        "display": "JavaScript",
        "comment": "//",
        "function": "function",
        "print": "console.log()",
        "input": "process.stdin / prompt()",
        "collection": "array",
        "exception": "try/catch",
        "import": "import or require()",
        "unique": "Set",
        "loop": "for",
        "debug": "Check the console and test a smaller case",
    },
    "java": {
        "display": "Java",
        "comment": "//",
        "function": "method",
        "print": "System.out.println()",
        "input": "Scanner",
        "collection": "ArrayList",
        "exception": "try/catch",
        "import": "import package",
        "unique": "HashSet",
        "loop": "for",
        "debug": "Read the stack trace and test a smaller case",
    },
    "c++": {
        "display": "C++",
        "comment": "//",
        "function": "function",
        "print": "cout",
        "input": "cin",
        "collection": "vector",
        "exception": "try/catch",
        "import": "#include",
        "unique": "set",
        "loop": "for",
        "debug": "Compile a small version and inspect the output",
    },
    "c": {
        "display": "C",
        "comment": "//",
        "function": "function",
        "print": "printf()",
        "input": "scanf()",
        "collection": "array",
        "exception": "error handling",
        "import": "#include",
        "unique": "struct + manual checks",
        "loop": "for",
        "debug": "Compile a tiny program and inspect warnings/errors",
    },
}


def normalize_language(language: str | None) -> str:
    value = (language or "python").strip().lower()
    return value if value in SUPPORTED_LANGUAGES else "python"


def _question(
    question_id: str,
    prompt: str,
    options: list[str],
    correct_index: int,
    topic: str,
) -> QuestionTemplate:
    return QuestionTemplate(
        question_id=question_id,
        prompt=prompt,
        options=options,
        correct_index=correct_index,
        topic=topic,
    )


def _build_questions(language: str) -> list[QuestionTemplate]:
    facts = LANGUAGE_FACTS[normalize_language(language)]
    display = facts["display"]

    return [
        _question(
            f"{language}-q1",
            f"In {display}, which symbol is commonly used for a single-line comment?",
            [facts["comment"], "/* */", "<!-- -->", "%"],
            0,
            "Basics",
        ),
        _question(
            f"{language}-q2",
            f"Which keyword or pattern is the most common way to define a reusable function in {display}?",
            [facts["function"], "class", "module", "loop"],
            0,
            "Functions",
        ),
        _question(
            f"{language}-q3",
            f"Which option is the clearest way to print output in {display}?",
            [facts["print"], facts["input"], facts["import"], "return"],
            0,
            "I/O",
        ),
        _question(
            f"{language}-q4",
            f"What is the best basic way to read user input in {display}?",
            [facts["input"], facts["print"], facts["unique"], facts["loop"]],
            0,
            "Input",
        ),
        _question(
            f"{language}-q5",
            f"Which structure is usually best for storing an ordered collection of items in {display}?",
            [facts["collection"], "boolean", "character", "exception"],
            0,
            "Data Structures",
        ),
        _question(
            f"{language}-q6",
            f"Which pattern is used to catch and handle runtime errors in {display}?",
            [facts["exception"], "print only", "loop", "comment"],
            0,
            "Error Handling",
        ),
        _question(
            f"{language}-q7",
            f"How do you usually bring in another package, module, or header in {display}?",
            [facts["import"], "while", "break", "switch"],
            0,
            "Imports",
        ),
        _question(
            f"{language}-q8",
            f"Which choice is the best fit for a collection of unique values in {display}?",
            [facts["unique"], "array of duplicates", "string", "stack"],
            0,
            "Collections",
        ),
        _question(
            f"{language}-q9",
            f"Which loop is the most common beginner-friendly loop for repeated counting in {display}?",
            [facts["loop"], "try", "catch", "import"],
            0,
            "Loops",
        ),
        _question(
            f"{language}-q10",
            f"What is the best first step when debugging a new {display} program?",
            [
                facts["debug"],
                "Ignore the error and move on",
                "Add more unrelated code",
                "Delete everything immediately",
            ],
            0,
            "Debugging",
        ),
    ]


def get_assessment_questions(language: str | None) -> list[dict]:
    normalized = normalize_language(language)
    questions = _build_questions(normalized)
    return [
        {
            "id": q.question_id,
            "prompt": q.prompt,
            "options": q.options,
            "topic": q.topic,
        }
        for q in questions
    ]


def score_assessment(language: str | None, answers: dict) -> dict:
    normalized = normalize_language(language)
    questions = _build_questions(normalized)
    answer_map = {str(key): value for key, value in (answers or {}).items()}

    correct = 0
    weak_topics: list[str] = []
    results: list[dict] = []

    for question in questions:
        raw_answer = answer_map.get(question.question_id)
        try:
            answer_index = int(raw_answer)
        except (TypeError, ValueError):
            answer_index = -1
        is_correct = answer_index == question.correct_index
        if is_correct:
            correct += 1
        else:
            weak_topics.append(question.topic)
        results.append(
            {
                "id": question.question_id,
                "correct": is_correct,
                "selected": answer_index,
                "topic": question.topic,
            }
        )

    total = len(questions)
    percentage = round((correct / total) * 100, 2) if total else 0.0
    if percentage >= 80:
        level = "advanced"
    elif percentage >= 55:
        level = "intermediate"
    else:
        level = "beginner"

    deduped_weak_topics = []
    seen = set()
    for topic in weak_topics:
        if topic in seen:
            continue
        seen.add(topic)
        deduped_weak_topics.append(topic)

    return {
        "language": normalized,
        "correct": correct,
        "total": total,
        "percentage": percentage,
        "recommended_level": level,
        "weak_topics": deduped_weak_topics[:8],
        "results": results,
    }
