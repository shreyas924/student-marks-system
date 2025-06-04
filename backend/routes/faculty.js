const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const { User, SubjectAssignment, Marks, CGPA } = require('../models');
const { Op } = require('sequelize');

// Get faculty's assigned subjects
router.get('/subjects', authenticateToken, authorize('faculty'), async (req, res) => {
  try {
    const subjects = await SubjectAssignment.findAll({
      where: {
        facultyId: req.user.id,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'faculty',
          attributes: ['id', 'name', 'email', 'facultyId']
        }
      ]
    });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects' });
  }
});

// Get students for a subject
router.get('/subject/:subjectId/students', authenticateToken, authorize('faculty'), async (req, res) => {
  try {
    // Verify faculty is assigned to this subject
    const assignment = await SubjectAssignment.findOne({
      where: {
        id: req.params.subjectId,
        facultyId: req.user.id,
        isActive: true
      }
    });

    if (!assignment) {
      return res.status(403).json({ message: 'Not authorized to access this subject' });
    }

    // Get students and their marks
    const students = await User.findAll({
      where: {
        role: 'student'
      },
      attributes: ['id', 'name', 'studentId', 'email']
    });

    // Get existing marks
    const marks = await Marks.findAll({
      where: {
        subjectAssignmentId: req.params.subjectId
      }
    });

    // Convert marks array to object for easier access
    const marksMap = marks.reduce((acc, mark) => {
      acc[mark.studentId] = mark;
      return acc;
    }, {});

    res.json({
      students,
      marks: marksMap
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Save or update marks
router.post('/subject/:subjectId/marks', authenticateToken, authorize('faculty'), async (req, res) => {
  try {
    const { marks } = req.body;
    const subjectId = req.params.subjectId;

    // Verify faculty is assigned to this subject
    const assignment = await SubjectAssignment.findOne({
      where: {
        id: subjectId,
        facultyId: req.user.id,
        isActive: true
      }
    });

    if (!assignment) {
      return res.status(403).json({ message: 'Not authorized to modify marks for this subject' });
    }

    // Save or update marks for each student
    const savedMarks = await Promise.all(
      marks.map(async (mark) => {
        const [savedMark] = await Marks.upsert({
          ...mark,
          subjectAssignmentId: subjectId
        });
        return savedMark;
      })
    );

    // Update CGPA for affected students
    const studentIds = marks.map(m => m.studentId);
    await updateCGPA(studentIds, assignment);

    res.json(savedMarks);
  } catch (error) {
    console.error('Error saving marks:', error);
    res.status(500).json({ message: 'Error saving marks' });
  }
});

// Helper function to update CGPA
async function updateCGPA(studentIds, assignment) {
  try {
    for (const studentId of studentIds) {
      // Get all marks for the student in current semester
      const semesterMarks = await Marks.findAll({
        where: {
          studentId,
          '$subjectAssignment.semester$': assignment.semester,
          '$subjectAssignment.year$': assignment.year
        },
        include: [{
          model: SubjectAssignment,
          as: 'subjectAssignment'
        }]
      });

      // Calculate GPA
      let totalPoints = 0;
      let totalCredits = 0;

      semesterMarks.forEach(mark => {
        if (mark.totalMarks !== null) {
          const credits = 4; // Assuming each subject has 4 credits
          totalPoints += getGradePoints(mark.grade) * credits;
          totalCredits += credits;
        }
      });

      const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

      // Update or create CGPA record
      await CGPA.upsert({
        studentId,
        semester: assignment.semester,
        academicYear: assignment.academicYear,
        totalCredits,
        earnedCredits: totalCredits,
        gpa
      });
    }
  } catch (error) {
    console.error('Error updating CGPA:', error);
  }
}

// Helper function to convert grade to grade points
function getGradePoints(grade) {
  switch (grade) {
    case 'A+': return 10;
    case 'A': return 9;
    case 'B': return 8;
    case 'C': return 7;
    case 'D': return 6;
    case 'F': return 0;
    default: return 0;
  }
}

module.exports = router; 