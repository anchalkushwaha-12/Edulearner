import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'student' | 'teacher';
  language: 'hi' | 'en';
  grade: number; // 6 to 10
  school_name?: string;
  created_at: string;
}

export interface StudentProfile {
  user_id: string;
  target_exam?: string;
  daily_study_minutes: number;
  preferred_subjects: string[];
  learning_pace?: 'gentle' | 'moderate' | 'accelerated';
}

export interface ClassRoom {
  id: string;
  teacher_id: string;
  name: string;
  grade: number;
  subject: string;
  join_code: string;
  created_at: string;
}

export interface ClassMembership {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
}

export interface Lesson {
  id: string;
  grade: number;
  subject: string;
  topic: string;
  title_en: string;
  title_hi: string;
  summary_en: string;
  summary_hi: string;
  content_en: string;
  content_hi: string;
  key_points_en: string[];
  key_points_hi: string[];
  examples_en: string[];
  examples_hi: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  is_sample: boolean;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'started' | 'completed';
  completed_at?: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  text: string;
  page_number?: number;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  chunks: DocumentChunk[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question_en: string;
  question_hi: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options_en: string[];
  options_hi: string[];
  correct_answer: string; // Stored server-side only! Never sent in initial quiz fetch
  hint_en: string;
  hint_hi: string;
  explanation_en: string;
  explanation_hi: string;
}

export interface Quiz {
  id: string;
  grade: number;
  subject: string;
  topic: string;
  title_en: string;
  title_hi: string;
  questions: QuizQuestion[];
  is_sample: boolean;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  subject: string;
  topic: string;
  score: number;
  total_questions: number;
  submitted_answers: Record<string, string>;
  answers_detail: Array<{
    question_id: string;
    submitted: string;
    correct: string;
    is_correct: boolean;
    explanation_en: string;
    explanation_hi: string;
  }>;
  operation_id?: string;
  created_at: string;
}

export interface TopicMastery {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  total_graded_answers: number;
  correct_answers: number;
  observed_accuracy: number; // 0.0 to 1.0
  mastery_status: 'insufficient_evidence' | 'needs_revision' | 'developing' | 'demonstrated_proficiency';
  recommendations: Array<{
    type: 'review_lesson' | 'practice_simpler' | 'take_revision_quiz' | 'advance_topic';
    message_en: string;
    message_hi: string;
    lesson_id?: string;
  }>;
  last_calculated_at: string;
}

export interface StudyPlanTask {
  id: string;
  title_en: string;
  title_hi: string;
  subject: string;
  topic: string;
  lesson_id?: string;
  estimated_minutes: number;
  status: 'pending' | 'completed' | 'rescheduled';
  due_date: string;
  reason_en: string;
  reason_hi: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  date: string;
  tasks: StudyPlanTask[];
  created_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string;
  lesson_id?: string;
  quiz_id?: string;
  due_date: string;
  created_at: string;
}

export interface SyncOperation {
  id: string;
  user_id: string;
  operation_id: string;
  entity_type: string;
  payload: any;
  processed_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  language: 'hi' | 'en';
  subject?: string;
  topic?: string;
  audio_url?: string;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  profiles: StudentProfile[];
  classes: ClassRoom[];
  memberships: ClassMembership[];
  lessons: Lesson[];
  lesson_progress: LessonProgress[];
  documents: DocumentRecord[];
  quizzes: Quiz[];
  quiz_attempts: QuizAttempt[];
  topic_mastery: TopicMastery[];
  study_plans: StudyPlan[];
  assignments: Assignment[];
  sync_operations: SyncOperation[];
  chat_messages: ChatMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    this.seedSampleDataIfEmpty();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading database file, initializing clean state:', err);
    }
    return {
      users: [],
      profiles: [],
      classes: [],
      memberships: [],
      lessons: [],
      lesson_progress: [],
      documents: [],
      quizzes: [],
      quiz_attempts: [],
      topic_mastery: [],
      study_plans: [],
      assignments: [],
      sync_operations: [],
      chat_messages: [],
    };
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      // Atomic write using temporary file to prevent partial write corruption
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  public get users() { return this.data.users; }
  public get profiles() { return this.data.profiles; }
  public get classes() { return this.data.classes; }
  public get memberships() { return this.data.memberships; }
  public get lessons() { return this.data.lessons; }
  public get lesson_progress() { return this.data.lesson_progress; }
  public get documents() { return this.data.documents; }
  public get quizzes() { return this.data.quizzes; }
  public get quiz_attempts() { return this.data.quiz_attempts; }
  public get topic_mastery() { return this.data.topic_mastery; }
  public get study_plans() { return this.data.study_plans; }
  public get assignments() { return this.data.assignments; }
  public get sync_operations() { return this.data.sync_operations; }
  public get chat_messages() { return this.data.chat_messages; }

  private seedSampleDataIfEmpty() {
    if (this.data.lessons.length === 0) {
      this.data.lessons = [
        {
          id: 'les-math-7-fractions',
          grade: 7,
          subject: 'Mathematics',
          topic: 'Fractions and Decimals',
          title_en: 'Understanding Fractions & Decimals in Daily Life',
          title_hi: 'दैनिक जीवन में भिन्न और दशमलव की समझ',
          summary_en: 'Learn how fractions represent parts of a whole, how to add/subtract fractions, and convert them to decimals.',
          summary_hi: 'समझें कि भिन्न किसी संपूर्ण के भाग को कैसे दर्शाते हैं, भिन्नों को जोड़ना/घटाना और उन्हें दशमलव में बदलना।',
          content_en: `### 1. What is a Fraction?
A fraction represents a part of a whole or collection.
It is written as:
$$\\frac{\\text{Numerator}}{\\text{Denominator}}$$
- **Numerator (अंश):** How many parts we have.
- **Denominator (हर):** How many equal parts the whole is divided into.

### 2. Types of Fractions
1. **Proper Fraction:** Numerator < Denominator (e.g., 2/5, 3/7). Value is less than 1.
2. **Improper Fraction:** Numerator >= Denominator (e.g., 7/4, 9/2). Value is >= 1.
3. **Mixed Fraction:** A whole number combined with a fraction (e.g., 1 3/4).

### 3. Real-life Rural Example
If a farmer divides a 1-acre field into 4 equal plots and plants wheat in 3 of them, the wheat occupies 3/4 of the field.
In decimal terms:
$$\\frac{3}{4} = 0.75 \\text{ acres}$$`,
          content_hi: `### 1. भिन्न क्या है?
भिन्न किसी संपूर्ण वस्तु या समूह के एक हिस्से को दर्शाती है।
इसे इस प्रकार लिखा जाता है:
$$\\frac{\\text{अंश (Numerator)}}{\\text{हर (Denominator)}}$$
- **अंश:** हमारे पास कितने हिस्से हैं।
- **हर:** संपूर्ण वस्तु को कितने बराबर भागों में बाँटा गया है।

### 2. भिन्नों के प्रकार
1. **उचित भिन्न (Proper Fraction):** अंश < हर (जैसे 2/5, 3/7)। मान 1 से कम होता है।
2. **अनुचित भिन्न (Improper Fraction):** अंश >= हर (जैसे 7/4, 9/2)। मान 1 या उससे अधिक होता है।
3. **मिश्र भिन्न (Mixed Fraction):** एक पूर्ण संख्या और भिन्न का मेल (जैसे 1 3/4)।

### 3. ग्रामीण जीवन का उदाहरण
यदि एक किसान 1 एकड़ खेत को 4 बराबर हिस्सों में बाँटता है और 3 हिस्सों में गेहूँ बोता है, तो गेहूँ का रकबा खेत का 3/4 भाग है।
दशमलव में:
$$\\frac{3}{4} = 0.75 \\text{ एकड़}$$`,
          key_points_en: [
            'Numerator indicates parts taken; denominator indicates total equal parts.',
            'To add like fractions: add numerators and keep the common denominator.',
            'Convert 3/4 to decimal by dividing 3 by 4 to get 0.75.'
          ],
          key_points_hi: [
            'अंश लिए गए हिस्सों को दर्शाता है; हर कुल बराबर भागों को दर्शाता है।',
            'समान हर वाले भिन्नों को जोड़ने के लिए अंशों को जोड़ें और हर वही रखें।',
            '3 को 4 से भाग देकर 3/4 को दशमलव 0.75 में बदल सकते हैं।'
          ],
          examples_en: [
            'Splitting 1 roti equally among 2 siblings = 1/2 roti each.',
            'Sharing 5 liters of milk across 2 households = 5/2 = 2.5 liters each.'
          ],
          examples_hi: [
            '1 रोटी को 2 भाई-बहनों में बराबर बाँटना = प्रत्येक को 1/2 रोटी।',
            '5 लीटर दूध 2 घरों में बराबर बाँटना = 5/2 = 2.5 लीटर प्रत्येक।'
          ],
          difficulty: 'easy',
          is_sample: true,
        },
        {
          id: 'les-sci-8-photosynthesis',
          grade: 8,
          subject: 'Science',
          topic: 'Nutrition in Plants & Photosynthesis',
          title_en: 'How Plants Make Food (Photosynthesis)',
          title_hi: 'पौधे भोजन कैसे बनाते हैं (प्रकाश संश्लेषण)',
          summary_en: 'Explore the process of autotrophic nutrition where green plants convert sunlight, carbon dioxide, and water into glucose and oxygen.',
          summary_hi: 'स्वपोषी पोषण की प्रक्रिया को समझें जहाँ हरे पौधे सूर्य के प्रकाश, कार्बन डाइऑक्साइड और जल को ग्लूकोज और ऑक्सीजन में बदलते हैं।',
          content_en: `### 1. Autotrophic Nutrition in Plants
Green plants are primary producers. Unlike animals that ingest food, plants manufacture their own food through **Photosynthesis**.

### 2. The Photosynthesis Equation
$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow[\\text{Chlorophyll}]{\\text{Sunlight}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$

### 3. Essential Raw Materials
1. **Chlorophyll:** Green pigment in chloroplasts that absorbs sunlight.
2. **Sunlight:** The solar energy powering the reaction.
3. **Carbon Dioxide ($CO_2$):** Taken from air through microscopic pores called **Stomata**.
4. **Water and Minerals:** Absorbed by roots from soil and transported via **Xylem** vessels.`,
          content_hi: `### 1. पौधों में स्वपोषी पोषण
हरे पौधे प्राथमिक उत्पादक हैं। जंतुओं के विपरीत, पौधे अपना भोजन स्वयं **प्रकाश संश्लेषण (Photosynthesis)** प्रक्रिया द्वारा बनाते हैं।

### 2. प्रकाश संश्लेषण का रासायनिक समीकरण
$$6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow[\\text{क्लोरोफिल}]{\\text{सूर्य का प्रकाश}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$

### 3. आवश्यक कच्ची सामग्रियां
1. **क्लोरोफिल (पर्णहरित):** पत्तियों में पाया जाने वाला हरा वर्णक जो सौर ऊर्जा को अवशोषित करता है।
2. **सूर्य का प्रकाश:** रासायनिक अभिक्रिया को ऊर्जा प्रदान करता है।
3. **कार्बन डाइऑक्साइड ($CO_2$):** पत्तियों के सूक्ष्म छिद्रों यानी **रंध्र (Stomata)** द्वारा वायु से ली जाती है।
4. **जल एवं खनिज:** जड़ों द्वारा मिट्टी से सोखे जाते हैं और **जाइलम (Xylem)** वाहिकाओं द्वारा पत्तियों तक पहुँचते हैं।`,
          key_points_en: [
            'Photosynthesis produces glucose (sugar for energy) and releases oxygen gas.',
            'Stomata on leaf surfaces regulate gas exchange (CO2 intake and O2 release).',
            'Desert plants perform CAM photosynthesis to conserve moisture.'
          ],
          key_points_hi: [
            'प्रकाश संश्लेषण ग्लूकोज बनाता है और वातावरण में ऑक्सीजन गैस छोड़ता है।',
            'पत्तियों की सतह पर मौजूद रंध्र गैसों के आदान-प्रदान को नियंत्रित करते हैं।',
            'रेगिस्तानी पौधे पानी बचाने के लिए रात में रंध्र खोलते हैं।'
          ],
          examples_en: [
            'Crops in sunny fields grow thicker leaves than plants shaded under trees.',
            'Iodine test turns leaf blue-black indicating presence of stored starch.'
          ],
          examples_hi: [
            'धूप वाले खेतों में फसलों की पत्तियाँ अधिक भोजन बनाती हैं।',
            'आयोडीन परीक्षण से पत्ती का रंग नीला-काला होना मंड (स्टार्च) की उपस्थिति दर्शाता है।'
          ],
          difficulty: 'medium',
          is_sample: true,
        },
        {
          id: 'les-math-9-linear-equations',
          grade: 9,
          subject: 'Mathematics',
          topic: 'Linear Equations in Two Variables',
          title_en: 'Linear Equations in Two Variables: Village Problem Solving',
          title_hi: 'दो चरों वाले रैखिक समीकरण: ग्रामीण समस्याओं का समाधान',
          summary_en: 'Learn how to formulate and solve equations with two unknown variables representing crop yields, costs, and labor.',
          summary_hi: 'दो अज्ञात चरों वाले समीकरण बनाना और हल करना सीखें जो फसलों की लागत और मजदूरी को दर्शाते हैं।',
          content_en: `### 1. General Form of Linear Equation
An equation of the form:
$$ax + by + c = 0$$
where $a$, $b$, and $c$ are real numbers, and $a$ and $b$ are not both zero, is called a **Linear Equation in Two Variables**.

### 2. Solution Set
A solution to a linear equation is an ordered pair $(x, y)$ that satisfies the equation.
Every linear equation in two variables has infinitely many solutions!
On a graph, its representation is a **straight line**.

### 3. Real World Problem
Suppose the cost of 2 kg of rice ($x$) and 3 kg of wheat ($y$) together is ₹180.
Equation:
$$2x + 3y = 180$$
If rice is ₹45/kg ($x = 45$), then:
$$2(45) + 3y = 180 \\implies 90 + 3y = 180 \\implies 3y = 90 \\implies y = 30$$
So wheat costs ₹30/kg.`,
          content_hi: `### 1. रैखिक समीकरण का मानक रूप
समीकरण का रूप:
$$ax + by + c = 0$$
जहाँ $a$, $b$ और $c$ वास्तविक संख्याएँ हैं और $a$ तथा $b$ दोनों शून्य नहीं हैं, **दो चरों वाला रैखिक समीकरण** कहलाता है।

### 2. हल समुच्चय
समीकरण का हल क्रमित युग्म $(x, y)$ होता है जो समीकरण को संतुष्ट करता है।
दो चरों वाले एक रैखिक समीकरण के **अपरिमित रूप से अनेक हल** होते हैं।
ग्राफ पर यह एक **सीधी रेखा** के रूप में दिखता है।

### 3. वास्तविक जीवन का उदाहरण
मान लीजिए 2 किग्रा चावल ($x$) और 3 किग्रा गेहूँ ($y$) का कुल मूल्य ₹180 है।
समीकरण:
$$2x + 3y = 180$$
यदि चावल ₹45 प्रति किग्रा ($x = 45$) है, तो:
$$2(45) + 3y = 180 \\implies 90 + 3y = 180 \\implies 3y = 90 \\implies y = 30$$
अतः गेहूँ ₹30 प्रति किग्रा है।`,
          key_points_en: [
            'General form: ax + by + c = 0 (where a and b are not zero).',
            'A linear equation in two variables represents a straight line on the Cartesian plane.',
            'Each point (x, y) on the line is a valid solution.'
          ],
          key_points_hi: [
            'मानक रूप: ax + by + c = 0 (जहाँ a और b शून्य नहीं हैं)।',
            'दो चरों वाला रैखिक समीकरण कार्तीय तल पर एक सीधी रेखा दर्शाता है।',
            'रेखा पर स्थित प्रत्येक बिंदु (x, y) समीकरण का एक हल है।'
          ],
          examples_en: [
            'Total cost of pens and notebooks: 5x + 10y = 150.',
            'Speed and time calculation for tractor traveling between villages.'
          ],
          examples_hi: [
            'कलम और कॉपियों का कुल मूल्य: 5x + 10y = 150।',
            'दो गाँवों के बीच ट्रैक्टर की गति और समय का हिसाब।'
          ],
          difficulty: 'medium',
          is_sample: true,
        },
        {
          id: 'les-sci-10-electricity',
          grade: 10,
          subject: 'Science',
          topic: 'Electricity & Ohm’s Law',
          title_en: 'Electric Circuits, Potential Difference & Ohm’s Law',
          title_hi: 'विद्युत परिपथ, विभवांतर और ओम का नियम',
          summary_en: 'Understand electric current, voltage, resistance, and how Ohm’s Law governs solar pumps and home wiring.',
          summary_hi: 'विद्युत धारा, वोल्टेज, प्रतिरोध और सोलर पंप व घरेलू वायरिंग में ओम के नियम का महत्व समझें।',
          content_en: `### 1. Electric Current ($I$)
Electric current is the rate of flow of electric charges through a conductor.
$$I = \\frac{Q}{t}$$
- Unit: **Ampere (A)**.

### 2. Potential Difference ($V$)
The work done to move a unit positive charge from one point to another:
$$V = \\frac{W}{Q}$$
- Unit: **Volt (V)**.

### 3. Ohm’s Law
At constant temperature, the current ($I$) flowing through a metallic conductor is directly proportional to the potential difference ($V$) across its ends:
$$V \\propto I \\implies V = I \\cdot R$$
Where $R$ is the **Resistance** of the conductor, measured in **Ohms ($\\Omega$)**.`,
          content_hi: `### 1. विद्युत धारा ($I$)
किसी चालक में विद्युत आवेश के प्रवाह की दर को विद्युत धारा कहते हैं।
$$I = \\frac{Q}{t}$$
- मात्रक: **एम्पीयर (A)**।

### 2. विभवांतर ($V$)
एकांक धन आवेश को एक बिंदु से दूसरे बिंदु तक ले जाने में किया गया कार्य:
$$V = \\frac{W}{Q}$$
- मात्रक: **वोल्ट (V)**।

### 3. ओम का नियम
एक नियत ताप पर, चालक के सिरों के बीच का विभवांतर ($V$) उसमें प्रवाहित होने वाली धारा ($I$) के समानुपाती होता है:
$$V \\propto I \\implies V = I \\cdot R$$
जहाँ $R$ चालक का **प्रतिरोध** है, जिसका मात्रक **ओम ($\\Omega$)** है।`,
          key_points_en: [
            'Ohm’s law: V = I * R.',
            'Higher resistance reduces the current flow for a fixed voltage.',
            'A voltmeter is connected in parallel; an ammeter is connected in series.'
          ],
          key_points_hi: [
            'ओम का नियम: V = I * R।',
            'नियत वोल्टेज पर अधिक प्रतिरोध धारा के मान को घटा देता है।',
            'वोल्टमीटर समांतर क्रम में और एमीटर श्रेणीक्रम में जोड़ा जाता है।'
          ],
          examples_en: [
            'Solar home inverter converting 12V battery power to run LEDs.',
            'Why thick copper wires are used for heavy water pumps (lower resistance).'
          ],
          examples_hi: [
            '12V बैटरी से सोलर इन्वर्टर द्वारा एलईडी बल्ब जलाना।',
            'पानी के बड़े मोटर पंप के लिए मोटे तांबे के तार का उपयोग (कम प्रतिरोध हेतु)।'
          ],
          difficulty: 'hard',
          is_sample: true,
        },
        {
          id: 'les-soc-8-constitution',
          grade: 8,
          subject: 'Social Science',
          topic: 'The Indian Constitution & Civic Rights',
          title_en: 'The Indian Constitution: Guiding Our Republic',
          title_hi: 'भारतीय संविधान: हमारे गणतंत्र का मार्गदर्शक',
          summary_en: 'Learn why India needed a constitution, its key features like Federalism, Fundamental Rights, and Secularism.',
          summary_hi: 'जानें भारत को संविधान की आवश्यकता क्यों थी, और संघवाद, मौलिक अधिकार तथा धर्मनिरपेक्षता जैसे प्रमुख पहलू।',
          content_en: `### 1. Why Does a Country Need a Constitution?
A Constitution lays down the ideals that citizens believe in and defines the political system of our nation.
It protects minorities against tyrannical majorities and guarantees fundamental rights to every citizen.

### 2. Key Features of the Indian Constitution
1. **Federalism:** Existence of government at more than one level (Center, State, and Panchayati Raj).
2. **Parliamentary Form of Government:** Representatives are elected directly by the people through Universal Adult Suffrage.
3. **Separation of Powers:** Legislature, Executive, and Judiciary prevent misuse of authority.
4. **Fundamental Rights:** Right to Equality, Freedom, Education, and Constitutional Remedies.`,
          content_hi: `### 1. देश को संविधान की आवश्यकता क्यों है?
संविधान उन आदर्शों को सूत्रबद्ध करता है जिन पर नागरिक विश्वास करते हैं और देश की राजनीतिक व्यवस्था तय करता है।
यह अल्पसंख्यकों के अधिकारों की रक्षा करता है और हर नागरिक को मौलिक अधिकार प्रदान करता है।

### 2. भारतीय संविधान के प्रमुख लक्षण
1. **संघवाद (Federalism):** देश में एक से अधिक स्तर पर सरकारों का होना (केंद्र, राज्य और पंचायती राज)।
2. **संसदीय शासन पद्धति:** सार्वभौमिक वयस्क मताधिकार द्वारा जनता अपने प्रतिनिधियों को चुनती है।
3. **शक्तियों का बँटवारा:** विधायिका, कार्यपालिका और न्यायपालिका एक दूसरे पर संतुलन बनाए रखती हैं।
4. **मौलिक अधिकार:** समानता का अधिकार, स्वतंत्रता का अधिकार, शोषण के विरुद्ध अधिकार आदि।`,
          key_points_en: [
            'Dr. B.R. Ambedkar was the Chairman of the Drafting Committee.',
            'Panchayati Raj represents local self-governance in rural villages.',
            'Fundamental Rights are enforceable by courts.'
          ],
          key_points_hi: [
            'डॉ. भीमराव आंबेडकर प्रारूप समिति के अध्यक्ष थे।',
            'पंचायती राज ग्रामीण स्तर पर स्थानीय स्वशासन का प्रतीक है।',
            'मौलिक अधिकारों की रक्षा न्यायालय द्वारा सुनिश्चित की जाती है।'
          ],
          examples_en: [
            'Gram Sabha meetings where villagers vote on drinking water schemes.',
            'Equal voting rights for every adult regardless of wealth or caste.'
          ],
          examples_hi: [
            'ग्राम सभा की बैठक जहाँ ग्रामीण पेयजल योजनाओं पर निर्णय लेते हैं।',
            'जाति, धर्म या संपत्ति के भेदभाव के बिना हर वयस्क का समान मत अधिकार।'
          ],
          difficulty: 'easy',
          is_sample: true,
        }
      ];
    }

    if (this.data.quizzes.length === 0) {
      this.data.quizzes = [
        {
          id: 'quiz-math-7-fractions',
          grade: 7,
          subject: 'Mathematics',
          topic: 'Fractions and Decimals',
          title_en: 'Practice Quiz: Fractions & Decimals',
          title_hi: 'अभ्यास प्रश्नोत्तरी: भिन्न और दशमलव',
          questions: [
            {
              id: 'q-fra-1',
              question_en: 'What is 3/4 expressed as a decimal?',
              question_hi: '3/4 को दशमलव के रूप में क्या लिखा जाएगा?',
              type: 'multiple_choice',
              options_en: ['0.25', '0.50', '0.75', '1.25'],
              options_hi: ['0.25', '0.50', '0.75', '1.25'],
              correct_answer: '0.75',
              hint_en: 'Divide 3 by 4.',
              hint_hi: '3 को 4 से भाग दें।',
              explanation_en: '3 divided by 4 equals 0.75.',
              explanation_hi: '3 को 4 से विभाजित करने पर 0.75 आता है।'
            },
            {
              id: 'q-fra-2',
              question_en: 'Which of the following is a Proper Fraction?',
              question_hi: 'निम्नलिखित में से कौन-सी उचित भिन्न (Proper Fraction) है?',
              type: 'multiple_choice',
              options_en: ['7/4', '3/5', '9/2', '5/5'],
              options_hi: ['7/4', '3/5', '9/2', '5/5'],
              correct_answer: '3/5',
              hint_en: 'In a proper fraction, numerator is less than denominator.',
              hint_hi: 'उचित भिन्न में अंश का मान हर से छोटा होता है।',
              explanation_en: 'In 3/5, 3 < 5, so it is a proper fraction.',
              explanation_hi: '3/5 में अंश (3) हर (5) से छोटा है, इसलिए यह उचित भिन्न है।'
            },
            {
              id: 'q-fra-3',
              question_en: 'True or False: To add two fractions with the same denominator, add their numerators directly.',
              question_hi: 'सत्य या असत्य: समान हर वाली दो भिन्नों को जोड़ने के लिए उनके अंशों को सीधे जोड़ा जाता है।',
              type: 'true_false',
              options_en: ['True', 'False'],
              options_hi: ['सत्य', 'असत्य'],
              correct_answer: 'True',
              hint_en: 'Consider 1/4 + 2/4 = 3/4.',
              hint_hi: 'सोचें: 1/4 + 2/4 = 3/4।',
              explanation_en: 'When denominators are identical, simply add numerators: a/c + b/c = (a+b)/c.',
              explanation_hi: 'जब हर समान होते हैं, तो सीधे अंशों का योग किया जाता है।'
            },
            {
              id: 'q-fra-4',
              question_en: 'What is 1/2 + 1/4 in simplest fraction form?',
              question_hi: '1/2 + 1/4 का सरलतम भिन्न रूप क्या होगा?',
              type: 'multiple_choice',
              options_en: ['2/6', '3/4', '1/3', '2/4'],
              options_hi: ['2/6', '3/4', '1/3', '2/4'],
              correct_answer: '3/4',
              hint_en: 'Convert 1/2 into 2/4 first.',
              hint_hi: 'पहले 1/2 को 2/4 में बदलें।',
              explanation_en: '1/2 = 2/4. Then 2/4 + 1/4 = 3/4.',
              explanation_hi: '1/2 = 2/4, अतः 2/4 + 1/4 = 3/4।'
            }
          ],
          is_sample: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'quiz-sci-8-photosynthesis',
          grade: 8,
          subject: 'Science',
          topic: 'Nutrition in Plants & Photosynthesis',
          title_en: 'Assessment: Photosynthesis Mechanism',
          title_hi: 'मूल्यांकन: प्रकाश संश्लेषण की क्रियाविधि',
          questions: [
            {
              id: 'q-pho-1',
              question_en: 'Which green pigment in leaves captures solar energy?',
              question_hi: 'पत्तियों में मौजूद कौन सा हरा वर्णक सौर ऊर्जा को अवशोषित करता है?',
              type: 'multiple_choice',
              options_en: ['Hemoglobin', 'Chlorophyll', 'Carotene', 'Xanthophyll'],
              options_hi: ['हीमोग्लोबिन', 'क्लोरोफिल (पर्णहरित)', 'कैरोटीन', 'जैंथोफिल'],
              correct_answer: 'Chlorophyll',
              hint_en: 'It gives plants their characteristic green hue.',
              hint_hi: 'यह पौधों को उनका हरा रंग प्रदान करता है।',
              explanation_en: 'Chlorophyll is located in chloroplasts and absorbs light for photosynthesis.',
              explanation_hi: 'क्लोरोफिल हरितलवक में होता है और प्रकाश संश्लेषण के लिए ऊर्जा सोखता है।'
            },
            {
              id: 'q-pho-2',
              question_en: 'What gas is released into the atmosphere during photosynthesis?',
              question_hi: 'प्रकाश संश्लेषण के दौरान कौन सी गैस वातावरण में छोड़ी जाती है?',
              type: 'multiple_choice',
              options_en: ['Carbon Dioxide', 'Nitrogen', 'Oxygen', 'Methane'],
              options_hi: ['कार्बन डाइऑक्साइड', 'नाइट्रोजन', 'ऑक्सीजन', 'मीथेन'],
              correct_answer: 'Oxygen',
              hint_en: 'The gas humans and animals inhale for respiration.',
              hint_hi: 'वह गैस जिसे मनुष्य सांस लेने के लिए उपयोग करते हैं।',
              explanation_en: 'Water molecules split to release Oxygen (O2) as a byproduct.',
              explanation_hi: 'जल के अणुओं के टूटने से सह-उत्पाद के रूप में ऑक्सीजन (O2) निकलती है।'
            },
            {
              id: 'q-pho-3',
              question_en: 'Through which microscopic leaf pores do plants exchange gases?',
              question_hi: 'पत्तियों के किन सूक्ष्म छिद्रों द्वारा गैसों का आदान-प्रदान होता है?',
              type: 'multiple_choice',
              options_en: ['Stomata', 'Xylem', 'Phloem', 'Root hairs'],
              options_hi: ['रंध्र (Stomata)', 'जाइलम', 'फ्लोएम', 'मूल रोम'],
              correct_answer: 'Stomata',
              hint_en: 'These pores are guarded by specialized guard cells.',
              hint_hi: 'इन छिद्रों के दोनों ओर द्वार कोशिकाएं होती हैं।',
              explanation_en: 'Stomata open and close to permit CO2 intake and O2 release.',
              explanation_hi: 'रंध्र (Stomata) कार्बन डाइऑक्साइड लेने और ऑक्सीजन छोड़ने में सहायता करते हैं।'
            }
          ],
          is_sample: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'quiz-sci-10-electricity',
          grade: 10,
          subject: 'Science',
          topic: 'Electricity & Ohm’s Law',
          title_en: 'Assessment: Electricity & Circuits',
          title_hi: 'मूल्यांकन: विद्युत और परिपथ',
          questions: [
            {
              id: 'q-ele-1',
              question_en: 'What is the mathematical formulation of Ohm’s Law?',
              question_hi: 'ओम के नियम का गणितीय रूप क्या है?',
              type: 'multiple_choice',
              options_en: ['V = I / R', 'V = I * R', 'V = R / I', 'I = V * R'],
              options_hi: ['V = I / R', 'V = I * R', 'V = R / I', 'I = V * R'],
              correct_answer: 'V = I * R',
              hint_en: 'Voltage equals Current multiplied by Resistance.',
              hint_hi: 'वोल्टेज बराबर विद्युत धारा गुणा प्रतिरोध।',
              explanation_en: 'Ohm’s law states V = I * R.',
              explanation_hi: 'ओम के नियमानुसार विभवांतर = धारा × प्रतिरोध (V = I * R)।'
            },
            {
              id: 'q-ele-2',
              question_en: 'What is the SI unit of electric resistance?',
              question_hi: 'विद्युत प्रतिरोध का SI मात्रक क्या है?',
              type: 'multiple_choice',
              options_en: ['Volt', 'Ampere', 'Ohm', 'Watt'],
              options_hi: ['वोल्ट', 'एम्पीयर', 'ओम (Ohm)', 'वाट'],
              correct_answer: 'Ohm',
              hint_en: 'Named after Georg Simon Ohm, symbol is Omega (Ω).',
              hint_hi: 'जॉर्ज साइमन ओम के नाम पर, प्रतीक ओमेगा (Ω) है।',
              explanation_en: 'Resistance is measured in Ohms (Ω).',
              explanation_hi: 'प्रतिरोध का SI मात्रक ओम (Ω) होता है।'
            }
          ],
          is_sample: true,
          created_at: new Date().toISOString()
        }
      ];
    }

    this.save();
  }
}

export const db = new DatabaseStore();
