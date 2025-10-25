# medstudy-pro
to help med students practice mcq, flashcards and more  
# Quick Reference for Each Mode

## Flashcard Mode
Reads from "flashcards" array:
```json
{
  "q": "Question text",
  "a": "Answer text",
  "qImage": "URL or empty string",
  "aImage": "URL or empty string"
}
```

## MCQ Mode 
Reads from "mcqs" array. MUST have "options" array and "correct" index:
```json
{
  "q": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,  // Index of correct answer (0-3)
  "explanation": "Why this is correct",
  "qImage": "URL or empty string"
}
```

## Theory/CBT Mode
Reads from "theory" array. MUST have "keywords" array for AI grading:
```json
{
  "q": "Essay question",
  "a": "Full detailed answer",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "qImage": "URL or empty string"
}
```

## OSCE Mode
Reads from "osce" array:
```json
{
  "stationType": "examination",
  "title": "Station name",
  "scenario": "Clinical scenario",
  "timeLimit": 480,  // seconds
  "checklist": [
    {
      "step": "What to do",
      "points": 2,
      "category": "Group name"
    }
  ]
}
```

## Steeplechase Mode
Reads from "steeplechase" array:
```json
{
  "q": "Quick question",
  "a": "Quick answer",
  "difficulty": "easy",  // or "medium", "hard", "beast"
  "points": 10
}
```
