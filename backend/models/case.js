import mongoose from 'mongoose';

const SeizedItemSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  quantity: { type: String, default: '1 unit' },
  value: { type: String, default: '₹ 0' },
  hash: { type: String, required: true },
  timestamp: { type: String, required: true },
  verificationStatus: { type: String, enum: ['Secured', 'Verified', 'Tampered'], default: 'Secured' }
});

const WitnessSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  relation: { type: String, default: '' },
  phone: { type: String, default: '' },
  statement: { type: String, required: true }
});

const TimelineSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  time: { type: String, required: true },
  date: { type: String, required: true },
  event: { type: String, required: true },
  type: { type: String, default: 'custom' }
});

const ComplianceSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  status: { type: String, enum: ['PASS', 'FAIL', 'PENDING'], default: 'PENDING' },
  missingItems: [{ type: String }],
  relevantSections: [{ type: String }]
});

const ContradictionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. "time", "location", "sequence"
  statement1: { type: String, required: true },
  statement2: { type: String, required: true },
  explanation: { type: String, required: true },
  confidenceScore: { type: Number, default: 0 }
});

const DeadlineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true }, // e.g. "medical", "remand", "chargesheet"
  dueDate: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending' },
  colorCode: { type: String, enum: ['green', 'yellow', 'red'], default: 'green' }
});

const CaseSchema = new mongoose.Schema({
  firNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  station: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  dateOfIncident: { type: String, required: true },
  timeOfIncident: { type: String, required: true },
  dateOfRegistration: { type: String, required: true },
  ioName: { type: String, required: true },
  ioBadge: { type: String, required: true },
  shoName: { type: String, default: '' },
  legalAdvisorName: { type: String, default: '' },
  flaggedSections: { type: String, default: '' },
  narrative: { type: String, required: true },
  
  accused: {
    name: { type: String, default: '' },
    age: { type: Number, default: 0 },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    status: { type: String, default: 'Absconding / Wanted' },
    arrestDate: { type: String, default: '' },
    arrestTime: { type: String, default: '' }
  },

  victim: {
    name: { type: String, default: '' },
    age: { type: Number, default: 0 },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    injuryStatus: { type: String, default: '' }
  },

  seizedItems: [SeizedItemSchema],
  witnesses: [WitnessSchema],
  timeline: [TimelineSchema],
  compliance: { type: ComplianceSchema, default: () => ({}) },
  contradictions: [ContradictionSchema],
  deadlines: [DeadlineSchema],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Case', CaseSchema);
