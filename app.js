(function bootstrapQuiz(root) {
  const modules = root.QuizAppModules || {};
  const createQuizApp = modules.quizApp && modules.quizApp.createQuizApp;

  if (!createQuizApp) {
    throw new Error("Quiz app controller is not available.");
  }

  createQuizApp().init();
})(typeof globalThis !== "undefined" ? globalThis : this);
