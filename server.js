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

// 25 Comprehensive Questions on Applications of Digital Electronics
const QUESTIONS = [
  {
    id: 'q1',
    prompt: 'Which component is considered the fundamental mathematical building block of digital computing circuits?',
    options: [
      { id: 'a', text: 'Logic gates (AND, OR, NOT, NAND)' },
      { id: 'b', text: 'Capacitor discharge banks' },
      { id: 'c', text: 'Analog bandpass filters' },
      { id: 'd', text: 'Step-up transformers' }
    ],
    correct: 'a',
    explanation: 'Logic gates implement Boolean algebra and form the core building blocks for registers, ALUs, and microprocessors.'
  },
  {
    id: 'q2',
    prompt: 'In automotive digital electronics, what role does the Engine Control Unit (ECU) perform?',
    options: [
      { id: 'a', text: 'Monitors digital & analog engine sensors to calculate precise ignition timing & fuel injection' },
      { id: 'b', text: 'Acts solely as a mechanical valve for coolant fluid' },
      { id: 'c', text: 'Manually switches interior lighting with bimetallic strips' },
      { id: 'd', text: 'Converts AC directly into hydraulic line pressure' }
    ],
    correct: 'a',
    explanation: 'The ECU is an embedded digital microcomputer running real-time software that samples sensor inputs to optimize combustion and emissions.'
  },
  {
    id: 'q3',
    prompt: 'Programmable Logic Controllers (PLCs) are ubiquitous in which engineering sector?',
    options: [
      { id: 'a', text: 'Industrial automation & robotic manufacturing' },
      { id: 'b', text: 'Culinary baking recipes' },
      { id: 'c', text: 'Acoustic violin fabrication' },
      { id: 'd', text: 'Manual hand weaving' }
    ],
    correct: 'a',
    explanation: 'PLCs are ruggedized digital computers designed for reliable control of industrial manufacturing, conveyors, and assembly lines.'
  },
  {
    id: 'q4',
    prompt: 'Why are digital communication signals preferred over analog signals across long distances?',
    options: [
      { id: 'a', text: 'Superior noise immunity and ability to regenerate clean binary pulses without accumulating error' },
      { id: 'b', text: 'Digital signals never experience transmission delay' },
      { id: 'c', text: 'Digital hardware requires zero electrical power' },
      { id: 'd', text: 'Digital media cannot be compressed' }
    ],
    correct: 'a',
    explanation: 'Digital signals distinguish between distinct binary logic levels; repeaters can regenerate pristine square waves without compounding analog line noise.'
  },
  {
    id: 'q5',
    prompt: 'Which medical diagnostic device heavily employs Digital Signal Processing (DSP) to filter noise and detect cardiac anomalies?',
    options: [
      { id: 'a', text: 'Digital Electrocardiogram (ECG) monitor' },
      { id: 'b', text: 'Mercury column thermometer' },
      { id: 'c', text: 'Acoustic stethoscope' },
      { id: 'd', text: 'Manual bulb sphygmomanometer' }
    ],
    correct: 'a',
    explanation: 'Modern ECGs use ADCs and DSP algorithms (like notch filters and wavelets) to eliminate muscle tremor noise and extract heart rhythm markers.'
  },
  {
    id: 'q6',
    prompt: 'In modern aircraft avionics, the glass cockpit displays and flight computers communicate over which high-reliability digital avionics bus standard?',
    options: [
      { id: 'a', text: 'MIL-STD-1553 and ARINC 429' },
      { id: 'b', text: 'VGA Analog Cable' },
      { id: 'c', text: 'RS-232 unshielded twisted pair' },
      { id: 'd', text: 'Parallel Centronics printer port' }
    ],
    correct: 'a',
    explanation: 'ARINC 429 and MIL-STD-1553 are specialized, fault-tolerant digital communication bus architectures designed specifically for aerospace and military avionics.'
  },
  {
    id: 'q7',
    prompt: 'What is the primary function of an Analog-to-Digital Converter (ADC) in smart consumer audio devices (e.g. smart speakers)?',
    options: [
      { id: 'a', text: 'Converts continuous acoustic microphone voltages into discrete digital PCM samples' },
      { id: 'b', text: 'Amplifies direct current to power the speaker cone' },
      { id: 'c', text: 'Modulates FM radio carrier frequencies' },
      { id: 'd', text: 'Generates mechanical vibration inside microphones' }
    ],
    correct: 'a',
    explanation: 'The microphone captures analog sound waves; the ADC quantizes these variations into digital binary streams so the microprocessor can process voice commands.'
  },
  {
    id: 'q8',
    prompt: 'What hardware technology allows engineers to prototype custom digital logic circuits rapidly using Hardware Description Languages (VHDL/Verilog)?',
    options: [
      { id: 'a', text: 'FPGA (Field Programmable Gate Array)' },
      { id: 'b', text: 'Vacuum tube triodes' },
      { id: 'c', text: 'Ferrite core memory' },
      { id: 'd', text: 'Inductive relay matrices' }
    ],
    correct: 'a',
    explanation: 'FPGAs contain arrays of programmable logic blocks and interconnects that can be reconfigured dynamically to implement complex digital hardware architectures.'
  },
  {
    id: 'q9',
    prompt: 'In digital servo motors and robotics, which digital modulation scheme is standard for precise motor speed and angle control?',
    options: [
      { id: 'a', text: 'Pulse Width Modulation (PWM)' },
      { id: 'b', text: 'Amplitude Modulation (AM)' },
      { id: 'c', text: 'Frequency Modulation (FM)' },
      { id: 'd', text: 'Phase Shift Keying (PSK)' }
    ],
    correct: 'a',
    explanation: 'PWM adjusts the duty cycle of a square wave to regulate the average voltage delivered to motors without excessive thermal energy loss.'
  },
  {
    id: 'q10',
    prompt: 'Which serial communication protocol uses only two lines (SDA and SCL) for digital IC inter-communication on PCBs?',
    options: [
      { id: 'a', text: 'I2C (Inter-Integrated Circuit)' },
      { id: 'b', text: 'Ethernet RJ-45' },
      { id: 'c', text: 'RS-485 balanced 4-wire' },
      { id: 'd', text: 'IEEE 1284 Parallel' }
    ],
    correct: 'a',
    explanation: 'I2C is a widely used synchronous two-wire bus (Serial Data and Serial Clock) invented by Philips for connecting sensors, EEPROMs, and RTCs to microcontrollers.'
  },
  {
    id: 'q11',
    prompt: 'In digital image sensors (CMOS/CCD) inside digital cameras and smartphones, what represents the pixel data?',
    options: [
      { id: 'a', text: 'Digital numeric values (e.g., 8-bit to 14-bit integers) representing color channel intensities' },
      { id: 'b', text: 'Chemical emulsion grains on celluloid film' },
      { id: 'c', text: 'Varying mechanical pressure waves' },
      { id: 'd', text: 'Magnetic strip flux alignments' }
    ],
    correct: 'a',
    explanation: 'Photodiodes collect photons into electrical charges, which on-chip ADCs convert into digital binary matrices representing red, green, and blue pixels.'
  },
  {
    id: 'q12',
    prompt: 'What type of digital memory retains its data even when power is turned off and is used in modern SSDs, USB drives, and smartphones?',
    options: [
      { id: 'a', text: 'NAND Flash Non-Volatile Memory' },
      { id: 'b', text: 'DRAM (Dynamic RAM)' },
      { id: 'c', text: 'SRAM (Static RAM)' },
      { id: 'd', text: 'Cathode-Ray Storage Tube' }
    ],
    correct: 'a',
    explanation: 'NAND Flash utilizes floating-gate or charge-trap transistors to retain digital state without requiring continuous power refresh.'
  },
  {
    id: 'q13',
    prompt: 'In modern telecommunications (4G LTE / 5G), which digital modulation technique enables high data throughput by splitting channels across orthogonal subcarriers?',
    options: [
      { id: 'a', text: 'OFDM (Orthogonal Frequency Division Multiplexing)' },
      { id: 'b', text: 'Analog CW Morse Keying' },
      { id: 'c', text: 'Single Sideband (SSB)' },
      { id: 'd', text: 'Frequency Shift Keying (FSK) only' }
    ],
    correct: 'a',
    explanation: 'OFDM is a digital multicarrier modulation scheme that achieves high spectral efficiency and mitigates multipath fading in cellular and Wi-Fi networks.'
  },
  {
    id: 'q14',
    prompt: 'Anti-lock Braking Systems (ABS) in vehicles utilize digital hall-effect wheel speed sensors to:',
    options: [
      { id: 'a', text: 'Detect imminent wheel lockup and rapidly pulse brake pressure via digital solenoid valves' },
      { id: 'b', text: 'Increase engine RPM during sudden stops' },
      { id: 'c', text: 'Turn off the headlights when stopping' },
      { id: 'd', text: 'Dispense wiper fluid when tires slip' }
    ],
    correct: 'a',
    explanation: 'ABS microcontrollers read digital pulses from wheel rotation sensors up to 100 times per second, commanding digital hydraulic valves to modulate braking and prevent skidding.'
  },
  {
    id: 'q15',
    prompt: 'Which digital circuit component is used to count clock cycles, divide frequencies, and generate precise time intervals in digital clocks and microcontrollers?',
    options: [
      { id: 'a', text: 'Binary Flip-Flop Counters (e.g., T or D flip-flops in cascade)' },
      { id: 'b', text: 'Varactor tuning diodes' },
      { id: 'c', text: 'Piezo buzzer discs' },
      { id: 'd', text: 'BJT power amplifiers' }
    ],
    correct: 'a',
    explanation: 'Flip-flops arranged in synchronous or asynchronous cascades act as binary frequency dividers and counters, converting crystal oscillator pulses into seconds and minutes.'
  },
  {
    id: 'q16',
    prompt: 'In Internet of Things (IoT) edge devices, what is the role of a low-power microcontroller (e.g., ARM Cortex-M or ESP32)?',
    options: [
      { id: 'a', text: 'Gathers environmental sensor data, processes digital telemetry, and transmits via wireless protocols (BLE, Wi-Fi, LoRa)' },
      { id: 'b', text: 'Generates thousands of watts of heat' },
      { id: 'c', text: 'Acts solely as an electrical ground rod' },
      { id: 'd', text: 'Converts optical light into nuclear radiation' }
    ],
    correct: 'a',
    explanation: 'Microcontrollers run embedded firmware to read digital sensors, execute edge computing logic, and communicate over wireless networks efficiently in sleep-wake cycles.'
  },
  {
    id: 'q17',
    prompt: 'Why are digital cryptographic accelerators (hardware AES, RSA engines) embedded in modern microprocessors and secure elements?',
    options: [
      { id: 'a', text: 'To perform cryptographic operations orders of magnitude faster and resist side-channel timing attacks' },
      { id: 'b', text: 'To compress raw audio into MP3 format' },
      { id: 'c', text: 'To replace the system power supply' },
      { id: 'd', text: 'To display graphical user interfaces' }
    ],
    correct: 'a',
    explanation: 'Dedicated digital hardware pipelines execute math-intensive encryption rounds (matrix Galois field operations) without stalling general CPU cores, securing bank cards and mobile devices.'
  },
  {
    id: 'q18',
    prompt: 'What digital component selects one input from several digital signal lines and routes it to a single output line based on control bits?',
    options: [
      { id: 'a', text: 'Multiplexer (MUX)' },
      { id: 'b', text: 'Operational Amplifier' },
      { id: 'c', text: 'Transformer' },
      { id: 'd', text: 'Schottky Diode' }
    ],
    correct: 'a',
    explanation: 'A Multiplexer (data selector) connects 2^N data inputs to 1 output using N select lines, widely used in CPU bus routing and telecommunication switches.'
  },
  {
    id: 'q19',
    prompt: 'Smart Electrical Power Grids use Phasor Measurement Units (PMUs) and SCADA systems. What core digital technology guarantees synchronized measurements across the nation?',
    options: [
      { id: 'a', text: 'GPS satellite atomic clock digital timestamps (IEEE C37.118)' },
      { id: 'b', text: 'Manual telephone dial-in checks' },
      { id: 'c', text: 'Mechanical pendulum clocks' },
      { id: 'd', text: 'Mercury vapor relays' }
    ],
    correct: 'a',
    explanation: 'Digital PMUs sample AC voltage/current waveforms microsecond-synchronized to GPS atomic clocks to analyze real-time grid stability and prevent blackouts.'
  },
  {
    id: 'q20',
    prompt: 'What is the function of a Digital-to-Analog Converter (DAC) in a smartphone when playing high-res music through wired headphones?',
    options: [
      { id: 'a', text: 'Translates binary PCM/DSD audio bits into a smooth continuous electrical voltage wave for headphone drivers' },
      { id: 'b', text: 'Reads the battery percentage voltage' },
      { id: 'c', text: 'Increases screen refresh rate' },
      { id: 'd', text: 'Recharges the lithium-ion battery' }
    ],
    correct: 'a',
    explanation: 'Audio stored digitally on flash memory consists of numbers (0s and 1s); the DAC reconstructs this into an analog audio waveform that moves the speaker diaphragm.'
  },
  {
    id: 'q21',
    prompt: 'In digital industrial robotics, what is the role of an optical rotary encoder?',
    options: [
      { id: 'a', text: 'Translates rotational joint movement into digital pulses / Gray code for closed-loop position feedback' },
      { id: 'b', text: 'Cools the robotic arm using optical fans' },
      { id: 'c', text: 'Supplies high AC voltage to drive motors' },
      { id: 'd', text: 'Paints the metal surfaces of the robot' }
    ],
    correct: 'a',
    explanation: 'Optical rotary encoders use patterned slotted discs and photodetectors to send digital position quadrature signals to motor controllers, achieving sub-millimeter positioning.'
  },
  {
    id: 'q22',
    prompt: 'Which digital logic family is dominant in modern VLSI microchips due to its extremely low static power dissipation?',
    options: [
      { id: 'a', text: 'CMOS (Complementary Metal-Oxide-Semiconductor)' },
      { id: 'b', text: 'TTL (Transistor-Transistor Logic)' },
      { id: 'c', text: 'RTL (Resistor-Transistor Logic)' },
      { id: 'd', text: 'ECL (Emitter-Coupled Logic)' }
    ],
    correct: 'a',
    explanation: 'CMOS combines complementary PMOS and NMOS transistors such that steady-state paths to ground are closed, drawing virtually zero current when not switching.'
  },
  {
    id: 'q23',
    prompt: 'In space exploration (e.g. Mars Rovers), why are digital electronics specifically radiation-hardened (Rad-Hard)?',
    options: [
      { id: 'a', text: 'To prevent cosmic ion strikes from causing Single Event Upsets (bit flips) and latch-up destruction' },
      { id: 'b', text: 'To improve radio music streaming clarity' },
      { id: 'c', text: 'To make the silicon chips flexible' },
      { id: 'd', text: 'To eliminate the need for software programming' }
    ],
    correct: 'a',
    explanation: 'Heavy cosmic particles can deposit charge in silicon junctions causing Single Event Upsets (SEU). Rad-hard designs use silicon-on-insulator (SOI) and triple modular redundancy.'
  },
  {
    id: 'q24',
    prompt: 'What role does an Arithmetic Logic Unit (ALU) play inside a Central Processing Unit (CPU)?',
    options: [
      { id: 'a', text: 'Executes fundamental binary arithmetic (ADD, SUB) and logical operations (AND, OR, XOR, shifts)' },
      { id: 'b', text: 'Acts as the external power transformer' },
      { id: 'c', text: 'Stores files permanently after power loss' },
      { id: 'd', text: 'Manages liquid nitrogen cooling cycles' }
    ],
    correct: 'a',
    explanation: 'The ALU is the digital compute engine inside the CPU, executing core binary calculations and comparisons commanded by program instructions.'
  },
  {
    id: 'q25',
    prompt: 'In digital medical infusion pumps, why are dual redundant digital microcontrollers employed with watchdog timers?',
    options: [
      { id: 'a', text: 'To cross-verify dosage calculations and instantly fail-safe if software hangs or diverges, preventing fatal medication errors' },
      { id: 'b', text: 'To display video games for the patient' },
      { id: 'c', text: 'To reduce the total manufacturing cost' },
      { id: 'd', text: 'To double the Wi-Fi download speed' }
    ],
    correct: 'a',
    explanation: 'Life-critical digital medical systems require redundant lockstep execution and hardware watchdogs so any detected fault immediately triggers an alarm and locks valves.'
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
