const OPERATORS = ["+", "-", "×", "÷"];

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const generateDivision = () => {
  const answer = randomInt(1, 99);
  const divisor = randomInt(1, 99);
  const dividend = answer * divisor;

  return {
    a: dividend,
    b: divisor,
    operator: "÷",
    answer,
  };
};

const generateQuestionData = () => {
  const operator = OPERATORS[randomInt(0, OPERATORS.length - 1)];

  let a, b, answer;

  switch (operator) {
    case "+":
      a = randomInt(1, 99);
      b = randomInt(1, 99);
      answer = a + b;
      break;

    case "-":
      a = randomInt(1, 99);
      b = randomInt(1, 99);

      // Pastikan tidak negatif
      if (b > a) [a, b] = [b, a];

      answer = a - b;
      break;

    case "×":
      a = randomInt(1, 99);
      b = randomInt(1, 99);
      answer = a * b;
      break;

    case "÷":
      return generateDivision();
  }

  return {
    a,
    b,
    operator,
    answer,
  };
};

const generateWrongAnswers = (correct) => {
  const wrongs = new Set();

  while (wrongs.size < 3) {
    const offset = randomInt(-20, 20);
    const value = correct + offset;

    if (value !== correct && value >= 0) {
      wrongs.add(value);
    }
  }

  return [...wrongs];
};

export const generateQuestion = () => {
  const { a, b, operator, answer } = generateQuestionData();

  const options = shuffle([answer, ...generateWrongAnswers(answer)]);

  return {
    text: `${a} ${operator} ${b} = ?`,
    answer,
    options,
  };
};

export const generateQuestions = (count = 5) => {
  return Array.from({ length: count }, () => generateQuestion());
};
