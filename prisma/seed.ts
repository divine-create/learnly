import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding CodeBridge Nigeria…')

  // Clear existing data
  await prisma.studentBadge.deleteMany()
  await prisma.badge.deleteMany()
  await prisma.quizAttempt.deleteMany()
  await prisma.question.deleteMany()
  await prisma.quiz.deleteMany()
  await prisma.materialChunk.deleteMany()
  await prisma.material.deleteMany()
  await prisma.lessonProgress.deleteMany()
  await prisma.tutorMessage.deleteMany()
  await prisma.tutorSession.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.classStudent.deleteMany()
  await prisma.class.deleteMany()
  await prisma.parentChild.deleteMany()
  await prisma.studentXP.deleteMany()
  await prisma.user.deleteMany()
  await prisma.school.deleteMany()

  // Badges
  const badges = await prisma.badge.createMany({
    data: [
      { name: 'First Quiz', description: 'Completed your first quiz!', icon: '🎯', condition: 'first_quiz', xpRequired: 0 },
      { name: 'Perfect Score', description: 'Got 100% on a quiz!', icon: '⭐', condition: 'perfect_score', xpRequired: 0 },
      { name: 'Speed Demon', description: 'Finished a quiz super fast!', icon: '⚡', condition: 'speed_demon', xpRequired: 0 },
      { name: 'Code Starter', description: 'Earned 100 XP!', icon: '🚀', condition: 'xp_100', xpRequired: 100 },
      { name: 'Bug Smasher', description: 'Earned 300 XP!', icon: '🐛', condition: 'xp_300', xpRequired: 300 },
      { name: 'Class Champion', description: 'Top of the class leaderboard!', icon: '🏆', condition: 'class_champion', xpRequired: 0 },
    ],
  })

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      role: 'SUPER_ADMIN',
      name: 'Platform Admin',
      email: 'super@codebridge.ng',
      passwordHash: await bcrypt.hash('super123', 12),
    },
  })
  console.log('✅ Super admin created:', superAdmin.email)

  // School
  const school = await prisma.school.create({
    data: {
      name: 'Greenfield Academy',
      state: 'Lagos',
      lga: 'Ikeja',
      type: 'both',
      code: 'GFAC-0042',
      plan: 'growth',
    },
  })
  console.log('✅ School created:', school.name, '·', school.code)

  // School Admin
  const admin = await prisma.user.create({
    data: {
      schoolId: school.id,
      role: 'SCHOOL_ADMIN',
      name: 'Mrs. Adaeze Okonkwo',
      email: 'admin@greenfield.ng',
      passwordHash: await bcrypt.hash('admin123', 12),
    },
  })

  // Teacher
  const teacher = await prisma.user.create({
    data: {
      schoolId: school.id,
      role: 'TEACHER',
      name: 'Mr. Emeka Chukwu',
      email: 'teacher@greenfield.ng',
      passwordHash: await bcrypt.hash('teacher123', 12),
    },
  })
  console.log('✅ Teacher created:', teacher.email)

  // Student
  const student = await prisma.user.create({
    data: {
      schoolId: school.id,
      role: 'STUDENT',
      name: 'Chidi Okafor',
      email: 'student@greenfield.ng',
      passwordHash: await bcrypt.hash('student123', 12),
      gradeLevel: 'JSS 2',
    },
  })
  await prisma.studentXP.create({ data: { studentId: student.id, totalXp: 150 } })
  console.log('✅ Student created:', student.email)

  // Parent
  const parent = await prisma.user.create({
    data: {
      schoolId: school.id,
      role: 'PARENT',
      name: 'Mr. Chukwuemeka Okafor',
      email: 'parent@gmail.com',
      passwordHash: await bcrypt.hash('parent123', 12),
    },
  })
  await prisma.parentChild.create({ data: { parentId: parent.id, childId: student.id } })
  console.log('✅ Parent created:', parent.email)

  // Python class
  const pythonClass = await prisma.class.create({
    data: {
      schoolId: school.id,
      teacherId: teacher.id,
      name: 'Python for Beginners',
      gradeLevel: 'JSS 2',
      subject: 'Python',
      code: 'PYT001',
    },
  })

  // Enroll student
  await prisma.classStudent.create({ data: { classId: pythonClass.id, studentId: student.id } })

  // Lesson 1
  const lesson1 = await prisma.lesson.create({
    data: {
      classId: pythonClass.id,
      title: 'Introduction to Variables',
      topic: 'Python Variables and Data Types',
      description: 'Learn what variables are and how to use them in Python',
      orderIndex: 0,
      isPublished: true,
    },
  })

  // Lesson 2
  const lesson2 = await prisma.lesson.create({
    data: {
      classId: pythonClass.id,
      title: 'Loops and Repetition',
      topic: 'For Loops and While Loops in Python',
      description: 'How to make the computer repeat things using loops',
      orderIndex: 1,
      isPublished: true,
    },
  })

  // Seed material chunks for lesson 1 (text content embedded as chunks)
  const lesson1Content = `
    In Python, a variable is like a box where you can store information.
    You give the box a name so you can find it later.
    For example: name = "Chidi" stores the text "Chidi" in a variable called name.
    Python supports different types of data: strings (text), integers (whole numbers),
    floats (decimal numbers), and booleans (True or False).
    To create a variable: my_name = "Amaka"
    To show a variable: print(my_name)
    Variables can change: x = 5 then x = 10 means x now holds 10.
    In Nigerian classrooms we can think of a variable like a customer's name on a suya stick —
    you put the name on it so you know whose order it is!
  `

  const material1 = await prisma.material.create({
    data: {
      lessonId: lesson1.id,
      teacherId: teacher.id,
      fileName: 'python_variables_notes.txt',
      fileUrl: 'seed/python_variables.txt',
      fileType: 'txt',
      fileSize: 500,
      status: 'ready',
    },
  })

  // Embed chunks for demo
  const chunks1 = [
    'In Python, a variable is like a box where you can store information. You give the box a name so you can find it later.',
    'Python supports different types of data: strings (text), integers (whole numbers), floats (decimal numbers), and booleans (True or False).',
    'To create a variable: my_name = "Amaka". To show a variable: print(my_name).',
    'Variables can change: x = 5 then x = 10 means x now holds 10. Variables are used to store information that your program needs.',
    'Think of a variable like a customer name on a suya stick — you put the name on it so you know whose order it is!',
  ]

  await prisma.materialChunk.createMany({
    data: chunks1.map((text, i) => ({
      materialId: material1.id,
      chunkText: text,
      chunkIndex: i,
      metadata: JSON.stringify({ lessonId: lesson1.id }),
    })),
  })

  // Quiz for lesson 1
  const quiz1 = await prisma.quiz.create({
    data: {
      lessonId: lesson1.id,
      schoolId: school.id,
      title: 'Python Variables Quiz',
      timeLimitSeconds: 300,
      totalXp: 100,
      status: 'published',
      questions: {
        create: [
          {
            type: 'mcq', orderIndex: 0, xp: 10,
            question: 'Which of the following correctly creates a variable in Python?',
            options: JSON.stringify(['var name = "Ade"', 'name = "Ade"', 'string name = "Ade"', 'let name = "Ade"']),
            correctIndex: 1,
            explanation: 'In Python, you create a variable by simply writing name = value. No keyword like var or let is needed.',
          },
          {
            type: 'mcq', orderIndex: 1, xp: 10,
            question: 'What type of data is the value "Jollof rice"?',
            options: JSON.stringify(['Integer', 'Float', 'String', 'Boolean']),
            correctIndex: 2,
            explanation: 'Text values in Python are called strings. They are enclosed in quotes.',
          },
          {
            type: 'mcq', orderIndex: 2, xp: 10,
            question: 'What does print(name) do in Python?',
            options: JSON.stringify(['Creates a variable', 'Deletes a variable', 'Shows the value of name on screen', 'Changes the value of name']),
            correctIndex: 2,
            explanation: 'print() displays the value of a variable or text on the screen.',
          },
          {
            type: 'mcq', orderIndex: 3, xp: 10,
            question: 'If x = 5 and then x = 10, what is the value of x?',
            options: JSON.stringify(['5', '10', '15', 'Error']),
            correctIndex: 1,
            explanation: 'Variables can be reassigned. The last assignment wins, so x becomes 10.',
          },
          {
            type: 'mcq', orderIndex: 4, xp: 10,
            question: 'Which of these is a boolean value in Python?',
            options: JSON.stringify(['"True"', '1.0', 'True', '100']),
            correctIndex: 2,
            explanation: 'Boolean values are True or False (capital T and F, no quotes). They represent yes/no conditions.',
          },
        ],
      },
    },
  })

  // Scratch class
  const scratchClass = await prisma.class.create({
    data: {
      schoolId: school.id,
      teacherId: teacher.id,
      name: 'Scratch for Primary 5',
      gradeLevel: 'Primary 5',
      subject: 'Scratch Programming',
      code: 'SCR001',
    },
  })

  const scratchLesson = await prisma.lesson.create({
    data: {
      classId: scratchClass.id,
      title: 'My First Scratch Project',
      topic: 'Getting started with Scratch programming',
      description: 'Learn how to move sprites and create your first animation!',
      orderIndex: 0,
      isPublished: true,
    },
  })

  const scratchQuiz = await prisma.quiz.create({
    data: {
      lessonId: scratchLesson.id,
      schoolId: school.id,
      title: 'Scratch Basics Quiz',
      timeLimitSeconds: 180,
      totalXp: 50,
      status: 'published',
      questions: {
        create: [
          {
            type: 'mcq', orderIndex: 0, xp: 10,
            question: 'In Scratch, what is a sprite?',
            options: JSON.stringify(['The background image', 'A character or object you can control', 'A sound effect', 'A code block']),
            correctIndex: 1,
            explanation: 'A sprite is any character or object in Scratch that you can control with code blocks.',
          },
          {
            type: 'mcq', orderIndex: 1, xp: 10,
            question: 'What does the "move 10 steps" block do?',
            options: JSON.stringify(['Makes the sprite jump', 'Moves the sprite forward by 10 steps', 'Rotates the sprite', 'Makes the sprite bigger']),
            correctIndex: 1,
            explanation: 'The "move 10 steps" block makes the sprite move forward in the direction it is facing.',
          },
          {
            type: 'mcq', orderIndex: 2, xp: 10,
            question: 'What does "when green flag clicked" mean in Scratch?',
            options: JSON.stringify(['The project stops', 'The project starts', 'The sprite changes colour', 'The sound plays']),
            correctIndex: 1,
            explanation: 'The green flag is the play button. "When green flag clicked" means your code runs when the project starts.',
          },
        ],
      },
    },
  })

  // Give student a quiz attempt
  await prisma.quizAttempt.create({
    data: {
      quizId: quiz1.id,
      studentId: student.id,
      score: 80,
      xpEarned: 80,
      timeTaken: 120,
      answers: JSON.stringify([1, 2, 2, 1, 2]),
    },
  })

  // Give student a badge
  const firstQuizBadge = await prisma.badge.findFirst({ where: { condition: 'first_quiz' } })
  if (firstQuizBadge) {
    await prisma.studentBadge.create({ data: { studentId: student.id, badgeId: firstQuizBadge.id } })
  }

  console.log('\n🎉 Seed complete! Demo accounts:')
  console.log('  🔴 Super Admin: super@codebridge.ng / super123')
  console.log('  🟣 School Admin: admin@greenfield.ng / admin123')
  console.log('  🔵 Teacher: teacher@greenfield.ng / teacher123')
  console.log('  🟡 Student: student@greenfield.ng / student123')
  console.log('  🟢 Parent: parent@gmail.com / parent123')
  console.log('\n  School code: GFAC-0042')
  console.log('  Python class code: PYT001')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
