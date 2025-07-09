import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import CourseList from '../components/CourseList';
import GpaDisplay from '../components/GpaDisplay';
// import RetakeSimulator from '../components/RetakeSimulator';
// import PremiumSection from '../components/PremiumSection';
// import './MainPage.css'; // 필요 시
import RetakeSimulationSection from "./RetakeSimulationSection";


const gradePoints = {
  'A+': 4.5, 'A': 4.5, 'A0': 4.0,
  'B+': 3.5, 'B': 3.5, 'B0': 3.0,
  'C+': 2.5, 'C': 2.5, 'C0': 2.0,
  'D+': 1.5, 'D': 1.5, 'D0': 1.0,
  'F': 0.0, 'FA': 0.0,
  'P': -1, 'NP': -2
};

const majorKeywords = ["전선", "전필", "전공선택", "전공필수", "학필"];

function MainPage() {
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
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      if (isMajorOnly && !course.isMajor) return;
      const point = gradePoints[course.grade];
      if (point !== undefined && point >= 0 && course.credits > 0) {
        totalPoints += point * course.credits;
        totalCredits += course.credits;
      }
    });

    return totalCredits === 0 ? 0.0 : (totalPoints / totalCredits);
  };

  useEffect(() => {
    if (allCourses.length > 0) {
      const currentOverallGpa = calculateGPA(allCourses);
      const currentMajorGpa = calculateGPA(allCourses, true);
      setOverallGpa(currentOverallGpa);
      setMajorGpa(currentMajorGpa);
      setRetakeOverallGpa(currentOverallGpa);
      setRetakeMajorGpa(currentMajorGpa);
      setIsRetakeCalculated(false);
    } else {
      setOverallGpa(0.0);
      setMajorGpa(0.0);
      setRetakeOverallGpa(0.0);
      setRetakeMajorGpa(0.0);
      setIsRetakeCalculated(false);
    }
  }, [allCourses]);

  const handleCoursesParsed = (parsedCourses) => {
    const coursesWithIds = parsedCourses.map((course, index) => ({
      ...course,
      id: course.id || `course-${index}-${Date.now()}`
    }));
    setAllCourses(coursesWithIds);
    setOriginalCourses(JSON.parse(JSON.stringify(coursesWithIds)));
    setIsFileUploadedAndParsed(true);
  };

  const handleMajorChange = (courseId, isMajor) => {
    setAllCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId ? { ...course, isMajor } : course
      )
    );
    setOriginalCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId ? { ...course, isMajor } : course
      )
    );
  };

  const handleRetakeSimulation = (simulatedCourses) => {
    setRetakeOverallGpa(calculateGPA(simulatedCourses));
    setRetakeMajorGpa(calculateGPA(simulatedCourses, true));
    setIsRetakeCalculated(true);
  };

  const resetRetakeSimulation = () => {
    setRetakeOverallGpa(overallGpa);
    setRetakeMajorGpa(majorGpa);
    setIsRetakeCalculated(false);
    setAllCourses(JSON.parse(JSON.stringify(originalCourses)));
  };

  const togglePremium = () => {
    setIsPremiumUser(prev => !prev);
  };

  return (
    <div className="container">
      <h1>GPA 계산기 및 재수강 시뮬레이터</h1>

      <section id="file-upload-section">
        <h2>성적표 업로드 (XLSX)</h2>
        <FileUpload
          onCoursesParsed={handleCoursesParsed}
          gradePointsMapping={gradePoints}
          majorKeywordsArray={majorKeywords}
        />
      </section>

      {isFileUploadedAndParsed && allCourses.length > 0 && (
        <>
          <section id="major-selection-section">
            <h2>과목 목록 및 전공 선택</h2>
            <CourseList courses={allCourses} onMajorChange={handleMajorChange} />
          </section>

          <section id="results-section" className="gpa-results">
            <h2>현재 평점</h2>
            <GpaDisplay label="전체 총평점" gpa={overallGpa} />
            <GpaDisplay label="전공 총평점" gpa={majorGpa} />
          </section>

          <section id="retake-simulation-section">
  <h2>재수강 시뮬레이션</h2>
  <p style={{ fontSize: "14px", color: "#777" }}>
    ※ 최대 2과목만 선택 가능 (프리미엄은 최대 5과목)
  </p>

  <RetakeSimulationSection
    originalCourses={originalCourses}
    isPremium={isPremiumUser}
    onSimulate={handleRetakeSimulation}
    onReset={resetRetakeSimulation}
    retakeOverallGpa={retakeOverallGpa}
    retakeMajorGpa={retakeMajorGpa}
    isRetakeCalculated={isRetakeCalculated}
  />
</section>

          <section id="premium-feature-section">
            <h2>프리미엄 기능</h2>
            <button onClick={togglePremium}>
              {isPremiumUser ? "프리미엄 비활성화" : "프리미엄 활성화"}
            </button>
          </section>
        </>
      )}
    </div>
  );
}

export default MainPage;
