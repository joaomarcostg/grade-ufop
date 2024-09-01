import { redirect } from 'next/navigation';
import { getCourses } from "@/lib/fetch-api/fetch-courses";
import CoursePicker from "@/components/CoursePicker";
import DisciplinesPicker from "@/components/DisciplinesPicker";
import { Container, Typography, Box } from "@mui/material";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  const coursesData = await getCourses();

  const courses = coursesData.map((course) => ({
    label: course.name,
    value: course.id,
  }));


  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {session.user?.name}!
        </Typography>
        <CoursePicker courses={courses} />
        <DisciplinesPicker />
      </Box>
    </Container>
  );
}