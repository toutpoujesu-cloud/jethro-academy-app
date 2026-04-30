// ── Content Status ────────────────────────────────────────────────────────────
export enum ContentStatus {
  DRAFT            = 'DRAFT',
  SUBMITTED        = 'SUBMITTED',       // Instructor submitted for review
  REVISION_NEEDED  = 'REVISION_NEEDED', // Admin sent back for changes
  APPROVED         = 'APPROVED',        // Admin approved — visible to learners
  ARCHIVED         = 'ARCHIVED',
}

// ── Lesson Type ───────────────────────────────────────────────────────────────
export enum LessonType {
  VIDEO      = 'VIDEO',
  AUDIO      = 'AUDIO',
  READING    = 'READING',    // PDF Book Reader
  QUIZ       = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  MIXED      = 'MIXED',      // Has multiple resource types
}

// ── Resource Type ─────────────────────────────────────────────────────────────
export enum ResourceType {
  VIDEO      = 'VIDEO',
  AUDIO      = 'AUDIO',
  PDF        = 'PDF',
  QUIZ       = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  LINK       = 'LINK',
}

// ── Quiz Question Type ────────────────────────────────────────────────────────
export enum QuizQuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE      = 'TRUE_FALSE',
  MATCHING        = 'MATCHING',
}

// ── Lesson Progress ───────────────────────────────────────────────────────────
export enum LessonProgressStatus {
  NOT_STARTED  = 'NOT_STARTED',
  IN_PROGRESS  = 'IN_PROGRESS',
  COMPLETED    = 'COMPLETED',
}

// ── Certificate Status ────────────────────────────────────────────────────────
export enum CertificateStatus {
  PENDING  = 'PENDING',   // Course complete, cert generating
  ISSUED   = 'ISSUED',
  REVOKED  = 'REVOKED',
}

// ── Core Content Interfaces ───────────────────────────────────────────────────

export interface IExpertiseArea {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  iconUrl:     string | null;
  sortOrder:   number;
  createdAt:   Date;
  updatedAt:   Date;
}

export interface ICourse {
  id:              string;
  expertiseAreaId: string;
  title:           string;
  slug:            string;
  description:     string | null;
  thumbnailUrl:    string | null;
  price:           number;           // In cents (e.g. 4999 = $49.99)
  currency:        string;           // ISO 4217 (e.g. 'usd')
  status:          ContentStatus;
  sortOrder:       number;
  createdAt:       Date;
  updatedAt:       Date;
}

export interface IModule {
  id:          string;
  courseId:    string;
  title:       string;
  description: string | null;
  sortOrder:   number;
  createdAt:   Date;
  updatedAt:   Date;
}

export interface ILesson {
  id:             string;
  moduleId:       string;
  instructorId:   string | null;
  title:          string;
  slug:           string;
  description:    string | null;
  type:           LessonType;
  status:         ContentStatus;
  estimatedMins:  number | null;
  sortOrder:      number;
  createdAt:      Date;
  updatedAt:      Date;
}

export interface ILessonResource {
  id:          string;
  lessonId:    string;
  type:        ResourceType;
  title:       string;
  url:         string;           // S3 URL, Vimeo embed URL, or external link
  mimeType:    string | null;
  fileSizeBytes: bigint | null;
  durationSecs:  number | null;  // For video/audio
  sortOrder:   number;
  createdAt:   Date;
}

export interface IQuiz {
  id:              string;
  lessonId:        string;
  title:           string;
  passingScore:    number;   // Percentage (0-100)
  shuffleQuestions: boolean;
  createdAt:       Date;
  updatedAt:       Date;
}

export interface IQuizQuestion {
  id:           string;
  quizId:       string;
  type:         QuizQuestionType;
  questionText: string;
  options:      unknown;    // JSON: { text, isCorrect }[] for MCQ; pairs[] for matching
  explanation:  string | null;
  points:       number;
  sortOrder:    number;
}

export interface IAssignment {
  id:          string;
  lessonId:    string;
  title:       string;
  instructions: string;
  rubric:      string | null;
  maxScore:    number;
  createdAt:   Date;
  updatedAt:   Date;
}

export interface ILessonProgress {
  id:               string;
  userId:           string;
  lessonId:         string;
  status:           LessonProgressStatus;
  watchPercentage:  number;    // 0-100
  videoWatched:     boolean;
  quizSubmitted:    boolean;
  quizScore:        number | null;
  assignmentSubmitted: boolean;
  assignmentScore:  number | null;
  assignmentFeedback: string | null;
  gradedAt:         Date | null;
  gradedById:       string | null;
  completedAt:      Date | null;
  createdAt:        Date;
  updatedAt:        Date;
}
