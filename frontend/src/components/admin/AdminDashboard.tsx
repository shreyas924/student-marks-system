import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  CssBaseline
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import SubjectManagement from './SubjectManagement';
import FacultyAssignment from './FacultyAssignment';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  value: string;
}

const AdminDashboard: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<string>('dashboard');

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, value: 'dashboard' },
    { text: 'Manage Subjects', icon: <BookIcon />, value: 'subjects' },
    { text: 'Faculty', icon: <PersonIcon />, value: 'faculty' },
    { text: 'Students', icon: <SchoolIcon />, value: 'students' },
    { text: 'Faculty Assignments', icon: <AssignmentIcon />, value: 'faculty-assignments' }
  ];

  const renderComponent = () => {
    switch (selectedComponent) {
      case 'subjects':
        return <SubjectManagement />;
      case 'faculty-assignments':
        return <FacultyAssignment />;
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4">Welcome to Admin Dashboard</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Select an option from the menu to manage different aspects of the system.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: open ? `${drawerWidth}px` : 0
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Student Marks Management System - Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.value}
                onClick={() => setSelectedComponent(item.value)}
                selected={selectedComponent === item.value}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: open ? `${drawerWidth}px` : 0
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {renderComponent()}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard; 