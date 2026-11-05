export function parseQuiz(value) {
  const data = typeof value === "string" ? JSON.parse(value) : value
  if (
    !data ||
    !Array.isArray(data.questions) ||
    !data.questions.length ||
    data.questions.length > 50
  )
    throw Error("A quiz requires between 1 and 50 questions")
  const text = (value, label) => {
    if (typeof value !== "string" || !value.trim() || value.length > 4000)
      throw Error(`Invalid quiz ${label}`)
    return value.trim()
  }
  const ids = new Set()
  const questions = data.questions.map((question, index) => {
    const id = String(question.id ?? `question-${index + 1}`)
    if (ids.has(id)) throw Error(`Duplicate quiz question: ${id}`)
    ids.add(id)
    if (
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.length > 8
    )
      throw Error(`Question ${id} requires 2–8 options`)
    const options = question.options.map((option) => text(option, "option"))
    if (new Set(options).size !== options.length) throw Error(`Duplicate quiz options: ${id}`)
    if (
      !Number.isInteger(question.answer) ||
      question.answer < 0 ||
      question.answer >= options.length
    )
      throw Error(`Question ${id} has an invalid answer index`)
    return {
      id,
      question: text(question.question, "question"),
      options,
      answer: question.answer,
      explanation: text(question.explanation, "explanation"),
    }
  })
  return { title: typeof data.title === "string" ? data.title.trim() : "", questions }
}
export function gradeQuiz(quiz, answers) {
  return {
    correct: quiz.questions.reduce(
      (count, question) => count + (answers[question.id] === question.answer ? 1 : 0),
      0,
    ),
    total: quiz.questions.length,
    answered: quiz.questions.filter((question) => Number.isInteger(answers[question.id])).length,
  }
}
