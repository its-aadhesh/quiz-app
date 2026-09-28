// ============================================================================
// CS BASICS — Programs & Algorithms (10 questions, 1st year)
//
// Syllabus coverage:
//   Programs and Algorithms · Problem Definition · Flow Chart ·
//   Fundamental Algorithms (exchange of two variables, counting, summation,
//   factorial, sine function computation, Fibonacci sequence, reversing the
//   digits of an integer, base conversion) ·
//   Problem → Algorithm Development → Algorithm Description →
//   Design Consideration → Applications
//
// Answer key is deliberately MIXED: b, c, d, a, c, a, d, b, d, a
// (A×3, B×2, C×2, D×3 — no guessable pattern.)
// ============================================================================

const QUESTIONS = [
  {
    id: 'q1',
    topic: 'Programs & Algorithms',
    prompt: 'What exactly is an "algorithm"?',
    options: [
      { id: 'a', text: 'A high-level programming language such as C or Python' },
      { id: 'b', text: 'A finite, step-by-step procedure that solves a problem in a limited number of steps' },
      { id: 'c', text: 'The final output that is printed by a computer program' },
      { id: 'd', text: 'A hardware circuit built inside the processor' }
    ],
    correct: 'b',
    explanation: 'An algorithm is a finite, ordered set of unambiguous steps that takes zero or more inputs and produces at least one output. A PROGRAM is the same algorithm written in a particular language (C, Python, Java) so that the computer can actually execute it. Algorithm = the idea, program = the implementation.'
  },
  {
    id: 'q2',
    topic: 'Problem Definition',
    prompt: 'While solving a problem on a computer, which step must come FIRST?',
    options: [
      { id: 'a', text: 'Writing the program in a programming language' },
      { id: 'b', text: 'Testing the program with sample data' },
      { id: 'c', text: 'Problem definition — clearly stating the inputs, the required outputs and the constraints' },
      { id: 'd', text: 'Printing the result on the screen' }
    ],
    correct: 'c',
    explanation: 'The standard order is: Problem Definition → Algorithm Development → Algorithm Description (pseudocode / flowchart) → Coding → Testing. If the problem is not defined properly, every later stage will faithfully solve the WRONG problem.'
  },
  {
    id: 'q3',
    topic: 'Flow Chart',
    prompt: 'In a flowchart, which symbol represents a DECISION (a condition with Yes / No branches)?',
    options: [
      { id: 'a', text: 'Rectangle' },
      { id: 'b', text: 'Parallelogram' },
      { id: 'c', text: 'Oval (ellipse)' },
      { id: 'd', text: 'Diamond (rhombus)' }
    ],
    correct: 'd',
    explanation: 'Flowchart symbols: Oval = Start / Stop, Parallelogram = Input / Output (READ, PRINT), Rectangle = Process or assignment, Diamond = Decision (two exits, true and false), Arrows = flow of control. The diamond is the only symbol with more than one way out.'
  },
  {
    id: 'q4',
    topic: 'Exchange of Two Variables',
    prompt: 'To exchange (swap) the values of two variables A and B using a temporary variable T, which sequence is correct?',
    options: [
      { id: 'a', text: 'T = A ; A = B ; B = T' },
      { id: 'b', text: 'A = B ; B = A ; T = A' },
      { id: 'c', text: 'T = A ; B = A ; A = T' },
      { id: 'd', text: 'A = T ; B = A ; T = B' }
    ],
    correct: 'a',
    explanation: 'Save A in T, copy B into A, then copy the saved value from T into B. If you write A = B first, the old value of A is destroyed and both variables end up holding B. Design consideration: the order of the three assignments matters — this is the classic example of "sequence" in algorithm design.'
  },
  {
    id: 'q5',
    topic: 'Counting',
    prompt: 'In a counting algorithm, which statement is placed INSIDE the loop so that every item is counted?',
    options: [
      { id: 'a', text: 'count = 0' },
      { id: 'b', text: 'count = count - 1' },
      { id: 'c', text: 'count = count + 1' },
      { id: 'd', text: 'count = count * 2' }
    ],
    correct: 'c',
    explanation: 'count = count + 1 (increment) adds one to the counter every time the loop body executes. count = 0 is the INITIALISATION and must be done exactly once, before the loop begins — forgetting it, or putting it inside the loop, is the most common counting bug.'
  },
  {
    id: 'q6',
    topic: 'Summation of a Set of Numbers',
    prompt: 'Before the loop that adds a set of numbers (sum = sum + number), what should the variable "sum" be initialised to?',
    options: [
      { id: 'a', text: '0' },
      { id: 'b', text: '1' },
      { id: 'c', text: 'The largest number in the set' },
      { id: 'd', text: 'The count of numbers in the set' }
    ],
    correct: 'a',
    explanation: 'An accumulator that ADDS must start at the additive identity, 0; any other starting value adds a constant error to the total. Compare this with factorial, which MULTIPLIES and therefore starts at the multiplicative identity, 1.'
  },
  {
    id: 'q7',
    topic: 'Factorial Computation',
    prompt: 'An algorithm computes N! using the statement fact = fact * i inside a loop. What must "fact" be initialised to?',
    options: [
      { id: 'a', text: '0' },
      { id: 'b', text: 'N' },
      { id: 'c', text: '-1' },
      { id: 'd', text: '1' }
    ],
    correct: 'd',
    explanation: 'fact must start at 1: it is the multiplicative identity and 0! is defined as 1. If fact started at 0, every multiplication would produce 0. The loop then runs i = 1, 2, 3 … N, so 5! = 1 x 2 x 3 x 4 x 5 = 120. Design consideration: factorials grow very fast, so N! overflows an ordinary integer beyond about N = 12.'
  },
  {
    id: 'q8',
    topic: 'Sine Function Computation',
    prompt: 'A computer evaluates sin x using the series  sin x = x - x^3/3! + x^5/5! - x^7/7! + …  Which statement about this computation is TRUE?',
    options: [
      { id: 'a', text: 'The angle x must be supplied in degrees' },
      { id: 'b', text: 'The terms alternate in sign and keep shrinking, so the loop stops when a term becomes smaller than the required accuracy' },
      { id: 'c', text: 'Exactly three terms are enough for every value of x' },
      { id: 'd', text: 'The series works only when x is a whole number' }
    ],
    correct: 'b',
    explanation: 'The angle must be in RADIANS. Each new term is obtained cheaply from the previous one (multiply by -x*x / ((2n)(2n+1))), and the loop is terminated when |term| < epsilon, e.g. 0.000001. Choosing that stopping condition is the main design consideration: it trades accuracy against computation time.'
  },
  {
    id: 'q9',
    topic: 'Fibonacci Sequence',
    prompt: 'The Fibonacci sequence begins 0, 1, 1, 2, 3, 5, 8, … What is the next term and what is the rule?',
    options: [
      { id: 'a', text: '10 — each term is the previous term plus 2' },
      { id: 'b', text: '11 — each term is the previous term plus its position number' },
      { id: 'c', text: '16 — each term is double the previous term' },
      { id: 'd', text: '13 — each term is the sum of the two preceding terms' }
    ],
    correct: 'd',
    explanation: 'F(n) = F(n-1) + F(n-2) with F(0) = 0 and F(1) = 1, so the term after 8 is 5 + 8 = 13. In a program only three variables are needed: next = a + b, then shift a = b and b = next. Applications: natural growth models, search techniques and the golden-ratio approximation F(n+1)/F(n).'
  },
  {
    id: 'q10',
    topic: 'Reversing Digits & Base Conversion',
    prompt: 'Reversing the digits of an integer (123 → 321) and converting a decimal number to another base (13 → 1101 in binary) both repeatedly use which pair of operations?',
    options: [
      { id: 'a', text: 'Remainder (n % base) to pick off the last digit, and integer division (n / base) to remove it' },
      { id: 'b', text: 'Addition and subtraction of 1 until the number becomes zero' },
      { id: 'c', text: 'Square root followed by rounding to the nearest whole number' },
      { id: 'd', text: 'Comparison with a constant and swapping of two variables' }
    ],
    correct: 'a',
    explanation: 'Both algorithms peel digits off the right-hand end: digit = n % base; n = n / base; repeated while n > 0. Digit reversal rebuilds the number with rev = rev * 10 + digit, while base conversion collects the remainders and reads them in REVERSE order — 13 → remainders 1,0,1,1 → 1101 in binary.'
  }
];

module.exports = QUESTIONS;
