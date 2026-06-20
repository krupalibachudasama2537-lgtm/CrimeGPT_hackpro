import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  caseId: {
    type: String,
    default: null
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  badge: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('AuditLog', AuditLogSchema);
