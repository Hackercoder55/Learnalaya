import { supabase } from '../api/supabaseClient';

const DEMO_STUDENTS = [
    {
        first_name: "Arav",
        last_name: "Sharma",
        parent_name: "Rajesh Sharma",
        parent_phone: "9876500001",
        address: "123, Gandhi Nagar, Delhi",
        fee: 2000,
        classes: [10],
        subjects: ["Maths", "Physics", "Chemistry"],
        grade: "Class 10"
    },
    {
        first_name: "Vivaan",
        last_name: "Gupta",
        parent_name: "Amit Gupta",
        parent_phone: "9876500002",
        address: "45, Civil Lines, Mumbai",
        fee: 1500,
        classes: [8],
        subjects: ["English", "History", "Geography"],
        grade: "Class 8"
    },
    {
        first_name: "Aditya",
        last_name: "Verma",
        parent_name: "Suresh Verma",
        parent_phone: "9876500003",
        address: "78, Model Town, Pune",
        fee: 2500,
        classes: [12],
        subjects: ["Computer", "Maths", "Physics"],
        grade: "Class 12"
    },
    {
        first_name: "Vihaan",
        last_name: "Singh",
        parent_name: "Vikram Singh",
        parent_phone: "9876500004",
        address: "12, Park Street, Kolkata",
        fee: 1800,
        classes: [9],
        subjects: ["Biology", "Chemistry", "English"],
        grade: "Class 9"
    },
    {
        first_name: "Arjun",
        last_name: "Reddy",
        parent_name: "Prakash Reddy",
        parent_phone: "9876500005",
        address: "Banjara Hills, Hyderabad",
        fee: 2200,
        classes: [11],
        subjects: ["Physics", "History", "Hindi"],
        grade: "Class 11"
    }
];

export async function seedDemoStudents() {
    // 1. Fetch available teachers to auto-assign
    const { data: teachers, error: teacherError } = await supabase
        .from('teachers')
        .select('user_id, subjects, classes')
        .eq('archived', false);

    if (teacherError) {
        console.error('Error fetching teachers for seeding:', teacherError);
        // Proceed without assignment if fetching teachers fails
    }

    const studentsToInsert = DEMO_STUDENTS.map(s => {
        // 2. Logic to find matching teachers (Same as AddStudent.jsx)
        let assignedIds = [];
        if (teachers && teachers.length > 0) {
            const eligible = teachers.filter(t =>
                (t.subjects || []).some(subject => s.subjects.includes(subject)) &&
                (t.classes || []).some(cls => s.classes.includes(cls))
            );
            assignedIds = eligible.map(t => t.user_id).filter(Boolean);
        }

        return {
            name: `${s.first_name} ${s.last_name}`,
            first_name: s.first_name,
            last_name: s.last_name,
            parent_name: s.parent_name,
            parent_whatsapp: s.parent_phone,
            address: s.address,
            fee: s.fee,
            classes: s.classes,
            grade: s.grade,
            subjects: s.subjects,
            assigned_teacher_ids: assignedIds, // Now correctly populated
            joined_date: new Date().toISOString().split('T')[0],
            archived: false
        };
    });

    const { data, error } = await supabase
        .from('students')
        .insert(studentsToInsert)
        .select();

    if (error) {
        throw new Error('Error seeding students: ' + error.message);
    }

    return data;
}
