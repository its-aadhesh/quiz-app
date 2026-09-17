const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Supabase configuration exposed for client init
const SUPABASE_CONFIG = {
  url: 'https://mbnwtelvfzjofeeviutg.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibnd0ZWx2Znpqb2ZlZXZpdXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzU2MzksImV4cCI6MjEwMzkxMTYzOX0.M7sQ4UXvEQAPfL5z_Ne07MH8WwK1KpXGywcQ4UEu8ws'
};

app.get('/api/config', (req, res) => {
  res.json(SUPABASE_CONFIG);
});

// 25 DPCO Questions — Digital Principles and Computer Organisation
const QUESTIONS = [
  {
    id: 'q1',
    prompt: 'What does the term "digital electronics" refer to?',
    options: [
      { id: 'a', text: 'Electronics dealing with discrete signals (0s and 1s) instead of continuous signals' },
      { id: 'b', text: 'Electronics that use only analog voltage levels to transmit information' },
      { id: 'c', text: 'Electronics primarily used for audio amplification circuits' },
      { id: 'd', text: 'Electronics based on mechanical relay switching' }
    ],
    correct: 'a',
    explanation: 'Digital electronics uses discrete binary signals — 0 (LOW) and 1 (HIGH) — to represent and process information, unlike analog electronics which uses continuously varying signals.'
  },
  {
    id: 'q2',
    prompt: 'Which of the following correctly lists the basic logic gates?',
    options: [
      { id: 'a', text: 'AND, OR, NOT, NAND, NOR, XOR, XNOR' },
      { id: 'b', text: 'ADD, SUB, MUL, DIV, MOD' },
      { id: 'c', text: 'AND, OR, XOR, FLIP, LATCH' },
      { id: 'd', text: 'NAND, NOR, BUFFER, SWITCH, RELAY' }
    ],
    correct: 'a',
    explanation: 'The seven fundamental logic gates are AND, OR, NOT, NAND, NOR, XOR, and XNOR. These gates form the building blocks of all digital circuits.'
  },
  {
    id: 'q3',
    prompt: 'What is the output of an AND gate when both inputs are 1?',
    options: [
      { id: 'a', text: '1 (High)' },
      { id: 'b', text: '0 (Low)' },
      { id: 'c', text: 'Undefined' },
      { id: 'd', text: 'It depends on the supply voltage' }
    ],
    correct: 'a',
    explanation: 'An AND gate outputs 1 (HIGH) only when ALL its inputs are 1. With both inputs = 1, the output is 1. For any other input combination, the output is 0.'
  },
  {
    id: 'q4',
    prompt: 'What is the output of an OR gate when both inputs are 0?',
    options: [
      { id: 'a', text: '0 (Low)' },
      { id: 'b', text: '1 (High)' },
      { id: 'c', text: 'Floating / High impedance' },
      { id: 'd', text: 'Alternates between 0 and 1' }
    ],
    correct: 'a',
    explanation: 'An OR gate outputs 0 (LOW) only when ALL its inputs are 0. When both inputs are 0, the output is 0. If at least one input is 1, the output is 1.'
  },
  {
    id: 'q5',
    prompt: 'What does a NOT gate do?',
    options: [
      { id: 'a', text: 'It inverts the input — 0 becomes 1, and 1 becomes 0' },
      { id: 'b', text: 'It amplifies the input signal by a factor of 2' },
      { id: 'c', text: 'It outputs 1 only when all inputs are 1' },
      { id: 'd', text: 'It adds two binary numbers together' }
    ],
    correct: 'a',
    explanation: 'A NOT gate (also called an inverter) has a single input and single output. It complements the input: input 0 gives output 1, and input 1 gives output 0.'
  },
  {
    id: 'q6',
    prompt: 'Which gates are called "universal gates"?',
    options: [
      { id: 'a', text: 'NAND and NOR gates' },
      { id: 'b', text: 'AND and OR gates' },
      { id: 'c', text: 'XOR and XNOR gates' },
      { id: 'd', text: 'NOT and BUFFER gates' }
    ],
    correct: 'a',
    explanation: 'NAND and NOR are called universal gates because any other logic gate (AND, OR, NOT, XOR, etc.) can be constructed using only NAND gates or only NOR gates.'
  },
  {
    id: 'q7',
    prompt: 'Why are NAND and NOR gates called universal gates?',
    options: [
      { id: 'a', text: 'Because any logic gate can be constructed using only NAND gates or only NOR gates' },
      { id: 'b', text: 'Because they are the fastest switching gates available' },
      { id: 'c', text: 'Because they operate at all voltage levels universally' },
      { id: 'd', text: 'Because they were the first gates to be invented' }
    ],
    correct: 'a',
    explanation: 'NAND and NOR gates are universal because they are functionally complete — AND, OR, and NOT can all be implemented using just NAND (or just NOR) gates, enabling any Boolean function.'
  },
  {
    id: 'q8',
    prompt: 'What is a Multiplexer (MUX)?',
    options: [
      { id: 'a', text: 'A digital circuit that selects one of several input signals and forwards it to a single output' },
      { id: 'b', text: 'A circuit that splits a single input into multiple outputs simultaneously' },
      { id: 'c', text: 'A memory element that stores one bit of data' },
      { id: 'd', text: 'A device that converts analog signals to digital format' }
    ],
    correct: 'a',
    explanation: 'A MUX (data selector) has 2^N data inputs, N select lines, and 1 output. The select lines determine which input is routed to the output. It is widely used in data routing and communication systems.'
  },
  {
    id: 'q9',
    prompt: 'What is a Demultiplexer (DEMUX)?',
    options: [
      { id: 'a', text: 'A digital circuit that takes a single input and routes it to one of several outputs' },
      { id: 'b', text: 'A circuit that combines multiple inputs into a single output' },
      { id: 'c', text: 'A circuit used to count clock pulses' },
      { id: 'd', text: 'A device that stores binary data in flip-flops' }
    ],
    correct: 'a',
    explanation: 'A DEMUX (data distributor) is the reverse of a MUX. It receives 1 input and distributes it to one of 2^N outputs based on the N select lines. It is used in data distribution systems.'
  },
  {
    id: 'q10',
    prompt: 'How many select lines are needed for a 4-to-1 MUX?',
    options: [
      { id: 'a', text: '2 select lines' },
      { id: 'b', text: '4 select lines' },
      { id: 'c', text: '1 select line' },
      { id: 'd', text: '3 select lines' }
    ],
    correct: 'a',
    explanation: 'A 4-to-1 MUX has 4 inputs and needs 2 select lines (since 2² = 4). The 2 select lines can form 4 binary combinations (00, 01, 10, 11) to choose among the 4 inputs.'
  },
  {
    id: 'q11',
    prompt: 'How many select lines are needed for a 1-to-8 DEMUX?',
    options: [
      { id: 'a', text: '3 select lines' },
      { id: 'b', text: '8 select lines' },
      { id: 'c', text: '2 select lines' },
      { id: 'd', text: '4 select lines' }
    ],
    correct: 'a',
    explanation: 'A 1-to-8 DEMUX routes 1 input to one of 8 outputs, requiring 3 select lines (since 2³ = 8). The 3-bit select code (000 to 111) determines which output is active.'
  },
  {
    id: 'q12',
    prompt: 'Which of the following is a real-life application of a Multiplexer (MUX)?',
    options: [
      { id: 'a', text: 'Selecting one data channel out of many for transmission (e.g., telephone exchange)' },
      { id: 'b', text: 'Storing multi-bit binary data in sequential memory' },
      { id: 'c', text: 'Converting decimal numbers to binary' },
      { id: 'd', text: 'Amplifying weak analog signals before digitization' }
    ],
    correct: 'a',
    explanation: 'MUX is used in telephone exchanges to combine multiple voice channels onto a single transmission line (Time Division Multiplexing), and in CPUs for bus sharing between multiple sources.'
  },
  {
    id: 'q13',
    prompt: 'Which of the following is a real-life application of a Demultiplexer (DEMUX)?',
    options: [
      { id: 'a', text: 'Distributing a single data signal to multiple output devices' },
      { id: 'b', text: 'Encoding multiple lines into a single binary code' },
      { id: 'c', text: 'Dividing clock frequency by a factor of 2' },
      { id: 'd', text: 'Storing one bit of data between clock pulses' }
    ],
    correct: 'a',
    explanation: 'DEMUX is used in communication receivers to separate a multiplexed signal back into individual channels, and in memory address decoding to enable one memory chip out of many.'
  },
  {
    id: 'q14',
    prompt: 'What is a flip-flop in digital electronics?',
    options: [
      { id: 'a', text: 'A basic memory element that stores one bit of data' },
      { id: 'b', text: 'A circuit that selects between two input signals' },
      { id: 'c', text: 'A gate that inverts its input on every clock pulse' },
      { id: 'd', text: 'A component used to amplify digital logic levels' }
    ],
    correct: 'a',
    explanation: 'A flip-flop is a bistable sequential circuit that stores 1 bit (either 0 or 1). It retains its state until changed by a clock pulse or control input. It is the fundamental building block of registers and memory.'
  },
  {
    id: 'q15',
    prompt: 'What is the main difference between a latch and a flip-flop?',
    options: [
      { id: 'a', text: 'A latch is level-triggered; a flip-flop is edge-triggered (clock-controlled)' },
      { id: 'b', text: 'A latch stores multiple bits; a flip-flop stores only one bit' },
      { id: 'c', text: 'A latch is used in counters; a flip-flop is used in logic gates' },
      { id: 'd', text: 'A latch uses CMOS; a flip-flop uses TTL technology' }
    ],
    correct: 'a',
    explanation: 'A latch is transparent when the enable signal is HIGH (level-sensitive), so output changes with input. A flip-flop changes state only on the rising or falling edge of a clock pulse (edge-triggered), making it more predictable in synchronous circuits.'
  },
  {
    id: 'q16',
    prompt: 'What does the T (Toggle) flip-flop do when T = 1?',
    options: [
      { id: 'a', text: 'It toggles (changes) its output state on every clock pulse' },
      { id: 'b', text: 'It holds its current output state unchanged' },
      { id: 'c', text: 'It resets its output to 0 unconditionally' },
      { id: 'd', text: 'It sets its output to 1 unconditionally' }
    ],
    correct: 'a',
    explanation: 'When T = 1, the T flip-flop toggles its output (Q becomes Q\' and Q\' becomes Q) on every active clock edge. When T = 0, it holds its current state — making it ideal for frequency division.'
  },
  {
    id: 'q17',
    prompt: 'What is the T flip-flop mainly used for?',
    options: [
      { id: 'a', text: 'Frequency division and building counters' },
      { id: 'b', text: 'Data storage and register design' },
      { id: 'c', text: 'Encoding binary to Gray code' },
      { id: 'd', text: 'Implementing combinational logic circuits' }
    ],
    correct: 'a',
    explanation: 'The T flip-flop toggles on each clock pulse when T=1, effectively dividing the clock frequency by 2 per stage. Cascading T flip-flops builds binary counters (ripple counters).'
  },
  {
    id: 'q18',
    prompt: 'What does the D (Data) flip-flop do?',
    options: [
      { id: 'a', text: 'It stores the value present at the D input on the active clock edge' },
      { id: 'b', text: 'It toggles its output on every clock pulse regardless of the input' },
      { id: 'c', text: 'It sets output to 1 when D = 1 and resets to 0 when D = 0 immediately' },
      { id: 'd', text: 'It outputs the complement of the J-K input combination' }
    ],
    correct: 'a',
    explanation: 'The D flip-flop (Delay flip-flop) captures the value on the D line at the clock\'s active edge and holds it until the next active edge. It has no invalid state, making it simple and reliable.'
  },
  {
    id: 'q19',
    prompt: 'What is the main use of a D flip-flop?',
    options: [
      { id: 'a', text: 'Data storage and synchronization in registers' },
      { id: 'b', text: 'Building frequency dividers and counters' },
      { id: 'c', text: 'Selecting between multiple data inputs' },
      { id: 'd', text: 'Performing arithmetic addition operations' }
    ],
    correct: 'a',
    explanation: 'D flip-flops are the core component of shift registers, data registers, and pipeline stages in processors. They synchronize data transfer between different parts of a digital system clocked at the same frequency.'
  },
  {
    id: 'q20',
    prompt: 'What is the JK flip-flop known for?',
    options: [
      { id: 'a', text: 'It eliminates the "invalid state" problem found in the SR flip-flop' },
      { id: 'b', text: 'It is the simplest flip-flop with only one input line' },
      { id: 'c', text: 'It stores 2 bits of data in a single element' },
      { id: 'd', text: 'It changes state only when reset to ground' }
    ],
    correct: 'a',
    explanation: 'The SR flip-flop has an undefined/invalid state when both S=1 and R=1. The JK flip-flop solves this by defining J=1, K=1 as a toggle operation, making it a universal flip-flop with no invalid state.'
  },
  {
    id: 'q21',
    prompt: 'What is a register in digital electronics?',
    options: [
      { id: 'a', text: 'A group of flip-flops used to store multiple bits of data' },
      { id: 'b', text: 'A single logic gate that holds one bit indefinitely' },
      { id: 'c', text: 'A lookup table that maps inputs to outputs' },
      { id: 'd', text: 'A circuit that counts the number of clock pulses' }
    ],
    correct: 'a',
    explanation: 'A register is a collection of D flip-flops (typically 4, 8, 16, or 32) that store a multi-bit binary word. Registers are used inside CPUs to hold operands, results, and control data during processing.'
  },
  {
    id: 'q22',
    prompt: 'What is a counter used for in digital electronics?',
    options: [
      { id: 'a', text: 'To count the number of clock pulses or events' },
      { id: 'b', text: 'To select one of multiple input data lines' },
      { id: 'c', text: 'To convert binary numbers to BCD format' },
      { id: 'd', text: 'To store a fixed multi-bit data word in registers' }
    ],
    correct: 'a',
    explanation: 'Counters are sequential circuits (made from flip-flops) that go through a predetermined sequence of binary states with each clock pulse. They are used for timers, frequency dividers, event counting, and address generation in memory.'
  },
  {
    id: 'q23',
    prompt: 'Which of the following is an everyday device that uses digital electronics?',
    options: [
      { id: 'a', text: 'Digital clock, calculator, and mobile phone' },
      { id: 'b', text: 'Analog thermometer, mercury barometer, and spring scale' },
      { id: 'c', text: 'Mechanical wristwatch, vinyl record player, and film camera' },
      { id: 'd', text: 'Glass vacuum tube radio, telegraph key, and rotary phone' }
    ],
    correct: 'a',
    explanation: 'Digital clocks use binary counters, calculators use ALUs and BCD circuits, and mobile phones use microprocessors, ADCs, DACs, and memory — all built from digital electronics components.'
  },
  {
    id: 'q24',
    prompt: 'What is the function of an encoder in digital electronics?',
    options: [
      { id: 'a', text: 'It converts multiple input lines into a coded binary output' },
      { id: 'b', text: 'It converts coded binary input into multiple output lines' },
      { id: 'c', text: 'It selects one of several inputs and routes it to a single output' },
      { id: 'd', text: 'It stores binary data across a group of flip-flops' }
    ],
    correct: 'a',
    explanation: 'An encoder takes 2^N input lines (only one active at a time) and produces an N-bit binary code. For example, an octal-to-binary encoder takes 8 inputs and produces a 3-bit binary output. Used in keyboards and priority encoders.'
  },
  {
    id: 'q25',
    prompt: 'What is the function of a decoder in digital electronics?',
    options: [
      { id: 'a', text: 'It converts coded binary input into multiple output lines (opposite of an encoder)' },
      { id: 'b', text: 'It converts multiple input lines into a single coded binary output' },
      { id: 'c', text: 'It routes one input signal to one of several outputs using select lines' },
      { id: 'd', text: 'It toggles its output on every clock pulse to divide frequency' }
    ],
    correct: 'a',
    explanation: 'A decoder takes an N-bit binary input and activates exactly one of 2^N output lines corresponding to that binary value. For example, a 3-to-8 decoder activates one of 8 outputs. Used in memory address decoding and display drivers.'
  }
];

// Public shape: no "correct" field exposed
app.get('/api/questions', (req, res) => {
  const publicQuestions = QUESTIONS.map(({ id, prompt, options }) => ({ id, prompt, options }));
  res.json(publicQuestions);
});

// Scoring and validation
app.post('/api/submit', (req, res) => {
  const answers = req.body.answers || {};
  let score = 0;

  const results = QUESTIONS.map((q) => {
    const chosen = answers[q.id];
    const isCorrect = chosen === q.correct;
    if (isCorrect) score += 1;
    return {
      id: q.id,
      chosen: chosen || null,
      correct: q.correct,
      isCorrect,
      explanation: q.explanation
    };
  });

  const total = QUESTIONS.length;
  const percentage = Math.round((score / total) * 100 * 100) / 100;

  res.json({ score, total, percentage, results });
});

app.listen(PORT, () => {
  console.log(`Quiz app running at http://localhost:${PORT}`);
});
