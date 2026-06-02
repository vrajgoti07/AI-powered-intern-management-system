const path = require('path');

let placementEmails;
try {
  // Dynamically load the compiled module from the backend dist directory
  placementEmails = require(path.join(__dirname, '../../backend/dist/lib/emails/placementEmails'));
} catch (e) {
  // Fallback if the backend has not been built yet (e.g. during dev startup or testing)
  placementEmails = {
    sendMentorEmail: async (to, mentorName, internName, department, matchScore, assignedDate) => {
      console.log(`[Email Mock] Mentor Email to ${to} (${mentorName}) for intern ${internName}`);
      return true;
    },
    sendInternEmail: async (to, internName, mentorName, department, matchScore) => {
      console.log(`[Email Mock] Intern Email to ${to} (${internName}) for mentor ${mentorName}`);
      return true;
    },
    sendAdminEmail: async (to, internName, mentorName, department, matchScore, confidenceLevel, appliedAt, status) => {
      console.log(`[Email Mock] Admin Email to ${to} for mapping ${internName} -> ${mentorName}`);
      return true;
    }
  };
}

module.exports = placementEmails;
