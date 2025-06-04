import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  CardActionArea,
  Box,
  Chip
} from '@mui/material';
import { Book as BookIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface SubjectCardProps {
  subject: {
    id: string;
    subjectName: string;
    subjectCode: string;
    year: number;
    semester: number;
    branch: string;
  };
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/faculty/subjects/${subject.id}/marks`);
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea onClick={handleClick} sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <BookIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              {subject.subjectName}
            </Typography>
          </Box>
          <Typography color="textSecondary" gutterBottom>
            Code: {subject.subjectCode}
          </Typography>
          <Box display="flex" gap={1} mt={2}>
            <Chip
              label={`Year ${subject.year}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Semester ${subject.semester}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={subject.branch}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default SubjectCard; 