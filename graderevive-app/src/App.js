import React, { useState, useEffect } from "react";
import FileUpload from "./components/FileUpload";
import CourseList from "./components/CourseList";
import GpaDisplay from "./components/GpaDisplay";

const gradePoints = {
  "A+": 4.5, A: 4.5, A0: 4.0,
  "B+": 3.5, B: 3.5, B0: 3.0,
  "C+": 2.5, C: 2.5, C0: 2.0,
  "D+": 1.5, D: 1.5, D0: 1.0,
  F: 0.0, FA: 0.0,
  P: -1, NP: -2
};

const majorKeywords = ["전선", "전필", "전공선택", "전공필수", "학필"];

function App() {
  const [allCourses, setAllCourses] = useState([]);
  const [originalCourses, setOriginalCourses] = useState([]);
  const [overallGpa, setOverallGpa] = useState(0.0);
  const [majorGpa, setMajorGpa] = useState(0.0);
  const [retakeOverallGpa, setRetakeOverallGpa] = useState(0.0);
  const [retakeMajorGpa, setRetakeMajorGpa] = useState(0.0);
  const [isRetakeCalculated, setIsRetakeCalculated] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isFileUploadedAndParsed, setIsFileUploadedAndParsed] = useState(false);

  const calculateGPA = (courses, isMajorOnly = false) => {
    let totalPoints = 0, totalCredits = 0;
    courses.forEach(course => {
      if (isMajorOnly && !course.isMajor) return;
      const point = gradePoints[course.grade];
      if (point !== undefined && point >= 0 && course.credits > 0) {
        totalPoints += point * course.credits;
        totalCredits += course.credits;
      }
    });
    if (totalCredits === 0) return 0.0;
    return totalPoints / totalCredits;
  };

  useEffect(() => {
    if (allCourses.length > 0) {
      const gpa = calculateGPA(allCourses);
      const majorG = calculateGPA(allCourses, true);
      setOverallGpa(gpa);
      setMajorGpa(majorG);
      setRetakeOverallGpa(gpa);
      setRetakeMajorGpa(majorG);
      setIsRetakeCalculated(false);
    }
  }, [allCourses]);

  const handleCoursesParsed = (parsedCourses) => {
    const withIds = parsedCourses.map((course, i) => ({
      ...course,
      id: course.id || `c-${i}-${Date.now()}`
    }));
    setAllCourses(withIds);
    setOriginalCourses(JSON.parse(JSON.stringify(withIds)));
    setIsFileUploadedAndParsed(true);
  };

  const handleMajorChange = (id, isMajor) => {
    setAllCourses(prev =>
      prev.map(c => c.id === id ? { ...c, isMajor } : c)
    );
    setOriginalCourses(prev =>
      prev.map(c => c.id === id ? { ...c, isMajor } : c)
    );
  };

  const togglePremium = () => setIsPremiumUser(prev => !prev);

  return (
    <div className="bg-slate-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-8">
          🎓 React GPA 계산기 + 재수강 시뮬레이터
        </h1>

        {/* 파일 업로드 */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border hover:shadow-2xl transition">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">성적표 업로드 (XLSX)</h2>
          <FileUpload
            onCoursesParsed={handleCoursesParsed}
            gradePointsMapping={gradePoints}
            majorKeywordsArray={majorKeywords}
          />
        </section>

        {isFileUploadedAndParsed && allCourses.length > 0 && (
          <>
            {/* 과목 목록 */}
            <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border hover:shadow-2xl transition">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">과목 목록 및 전공 선택</h2>
              <CourseList courses={allCourses} onMajorChange={handleMajorChange} />
            </section>

            {/* GPA 결과 */}
            <section className="bg-white rounded-2xl shadow-lg p-8 mb-8 border hover:shadow-2xl transition">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">현재 평점</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GpaDisplay label="전체 총평점" gpa={overallGpa} />
                <GpaDisplay label="전공 총평점" gpa={majorGpa} />
              </div>
            </section>

            {/* 프리미엄 */}
            <section className="bg-yellow-50 rounded-2xl shadow-lg p-8 mb-8 border border-yellow-200 hover:shadow-2xl transition">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">프리미엄 기능</h2>
              <button
                onClick={togglePremium}
                className={`px-6 py-3 rounded-full text-lg font-semibold shadow
                  ${isPremiumUser
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-yellow-400 hover:bg-yellow-500 text-slate-800"
                  } transition`}
              >
                {isPremiumUser ? "✅ 프리미엄 활성화됨" : "💎 프리미엄 활성화 (₩990)"}
              </button>
              {isPremiumUser && (
                <p className="mt-4 text-green-800 font-medium">
                  프리미엄 기능이 활성화되었습니다. 재수강 시뮬레이터에서 더 많은 과목을 선택할 수 있습니다.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
