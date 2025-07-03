import React, { useState, useEffect } from 'react';
import './App.css';
// Placeholder for components to be created later
// import FileUpload from './components/FileUpload';
// import CourseList from './components/CourseList';
// import GpaDisplay from './components/GpaDisplay';
// import RetakeSimulator from './components/RetakeSimulator';
// import PremiumSection from './components/PremiumSection';

// Grade to point mapping - will be used by calculation logic
const gradePoints = {
  'A+': 4.5, 'A': 4.5, 'A0': 4.0,
  'B+': 3.5, 'B': 3.5, 'B0': 3.0,
  'C+': 2.5, 'C': 2.5, 'C0': 2.0,
  'D+': 1.5, 'D': 1.5, 'D0': 1.0,
  'F': 0.0,
  'FA': 0.0,
  'P': -1, // Pass, to be excluded from GPA calculation
  'NP': -2, // Non-Pass, to be excluded from GPA calculation
};

// Keywords to identify major courses from "이수구분"
const majorKeywords = ["전선", "전필", "전공선택", "전공필수", "학필"];

function App() {
  const [allCourses, setAllCourses] = useState([]);
  const [originalCourses, setOriginalCourses] = useState([]); // Store courses before retake simulation

  // GPA States
  const [overallGpa, setOverallGpa] = useState(0.0);
  const [majorGpa, setMajorGpa] = useState(0.0);

  // Retake GPA States - these will reflect the *simulated* GPAs
  const [retakeOverallGpa, setRetakeOverallGpa] = useState(0.0);
  const [retakeMajorGpa, setRetakeMajorGpa] = useState(0.0);
  const [isRetakeCalculated, setIsRetakeCalculated] = useState(false);

  // Premium feature state
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // UI flow control states
  const [isFileUploadedAndParsed, setIsFileUploadedAndParsed] = useState(false);
  // const [areMajorsConfirmed, setAreMajorsConfirmed] = useState(false); // May not be needed if majors are auto-set or confirmed implicitly

  // GPA Calculation (can be memoized with useMemo if performance becomes an issue)
  const calculateGPA = (courses, isMajorOnly = false) => {
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      if (isMajorOnly && !course.isMajor) {
        return;
      }
      const point = gradePoints[course.grade];
      if (point !== undefined && point >= 0 && course.credits > 0) { // Only count courses with positive credits for GPA
        totalPoints += point * course.credits;
        totalCredits += course.credits;
      }
    });

    if (totalCredits === 0) return 0.0;
    return (totalPoints / totalCredits); // .toFixed(2) will be applied at display time
  };

  // Effect to calculate initial GPAs when allCourses or their major status changes
  useEffect(() => {
    if (allCourses.length > 0) {
      const currentOverallGpa = calculateGPA(allCourses);
      const currentMajorGpa = calculateGPA(allCourses, true);
      setOverallGpa(currentOverallGpa);
      setMajorGpa(currentMajorGpa);

      // When courses change, reset retake GPAs to current, or to 0 if no courses
      setRetakeOverallGpa(currentOverallGpa);
      setRetakeMajorGpa(currentMajorGpa);
      setIsRetakeCalculated(false); // Reset retake flag
    } else {
      setOverallGpa(0.0);
      setMajorGpa(0.0);
      setRetakeOverallGpa(0.0);
      setRetakeMajorGpa(0.0);
      setIsRetakeCalculated(false);
    }
  }, [allCourses]); // Dependency on allCourses

  // Handler for when courses are parsed from file
  const handleCoursesParsed = (parsedCourses) => {
    // Add a unique ID to each course for React list keys, if not already present
    const coursesWithIds = parsedCourses.map((course, index) => ({
      ...course,
      id: course.id || `course-${index}-${new Date().getTime()}` // Simple unique ID
    }));
    setAllCourses(coursesWithIds);
    setOriginalCourses(JSON.parse(JSON.stringify(coursesWithIds))); // Deep copy for resetting retakes
    setIsFileUploadedAndParsed(true);
  };

  // Handler for major selection changes (if manual adjustment is needed)
  // This will update the isMajor flag in the allCourses state
  const handleMajorChange = (courseId, isMajor) => {
    setAllCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId ? { ...course, isMajor: isMajor } : course
      )
    );
    // Also update originalCourses to keep them in sync regarding major status
    setOriginalCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId ? { ...course, isMajor: isMajor } : course
      )
    );
  };

  // Handler for retake simulation
  const handleRetakeSimulation = (simulatedCourses) => {
    // simulatedCourses are the 'allCourses' list but with some grades changed
    const newRetakeOverallGpa = calculateGPA(simulatedCourses);
    const newRetakeMajorGpa = calculateGPA(simulatedCourses, true);

    setRetakeOverallGpa(newRetakeOverallGpa);
    setRetakeMajorGpa(newRetakeMajorGpa);
    setIsRetakeCalculated(true);

    // To allow further retake simulations on the already simulated state,
    // you might want to update allCourses to simulatedCourses.
    // Or, always simulate from originalCourses. For now, let's assume retake display is separate.
    // If we want to chain retakes, allCourses should become simulatedCourses:
    // setAllCourses(simulatedCourses);
  };

  const resetRetakeSimulation = () => {
    setRetakeOverallGpa(overallGpa);
    setRetakeMajorGpa(majorGpa);
    setIsRetakeCalculated(false);
    setAllCourses(JSON.parse(JSON.stringify(originalCourses))); // Reset to original parsed state
  };

  // Handler for premium activation
  const togglePremium = () => {
    setIsPremiumUser(prev => !prev); // Simple toggle for now
  };

  // Placeholder for actual component JSX
  return (
    <div className="container">
      <h1>React GPA 계산기 및 재수강 시뮬레이터</h1>

      {/* FileUpload Component - to be implemented */}
      <section id="file-upload-section">
        <h2>성적표 업로드 (XLSX)</h2>
        <FileUpload
            onCoursesParsed={handleCoursesParsed}
            gradePointsMapping={gradePoints}
            majorKeywordsArray={majorKeywords}
        />
        {/* {!isFileUploadedAndParsed && !allCourses.length && <p>XLSX 파일을 업로드해주세요.</p>} */}
      </section>

      {/* Only show subsequent sections if courses have been successfully parsed and allCourses has items */}
      {isFileUploadedAndParsed && allCourses.length > 0 && (
        <>
          {/* CourseList Component - to be implemented */}
          <section id="major-selection-section">
            <h2>과목 목록 및 전공 선택</h2>
            <CourseList courses={allCourses} onMajorChange={handleMajorChange} />
          </section>

          {/* GpaDisplay Component - to be implemented */}
          <section id="results-section" className="gpa-results">
            <h2>현재 평점</h2>
            <GpaDisplay label="전체 총평점" gpa={overallGpa} />
            <GpaDisplay label="전공 총평점" gpa={majorGpa} />
          </section>

          {/* RetakeSimulator Component - to be implemented */}
          <section id="retake-simulation-section">
            <h2>재수강 시뮬레이션</h2>
            {/*
              RetakeSimulator will be implemented here.
              It will receive 'originalCourses', 'isPremiumUser',
            <RetakeSimulator
                originalCourses={originalCourses}
                onSimulate={handleRetakeSimulation}
                onReset={resetRetakeSimulation}
                isPremium={isPremiumUser}
                gradePointsMapping={gradePoints}
            />
            {isRetakeCalculated && (
              <div className="retake-results" style={{marginTop: '20px'}}>
                <h3>재수강 후 예상 평점</h3>
                <GpaDisplay label="전체 총평점" gpa={retakeOverallGpa} isRetake={true} />
                <GpaDisplay label="전공 총평점" gpa={retakeMajorGpa} isRetake={true} />
              </div>
            )}
             {/* Button to reset retake simulation can be here or inside RetakeSimulator */}
             {isRetakeCalculated && <button onClick={resetRetakeSimulation} style={{marginTop: '10px'}}>재수강 시뮬레이션 초기화</button>}
          </section>

          {/* PremiumSection Component - to be implemented */}
          <section id="premium-feature-section">
            <h2>프리미엄 기능</h2>
            {/* <PremiumSection isPremium={isPremiumUser} onTogglePremium={togglePremium} /> */}
            <button onClick={togglePremium} className={isPremiumUser ? "" : "premium-button"}>
              {isPremiumUser ? "프리미엄 활성화됨 (비활성화하려면 클릭)" : "프리미엄 기능 활성화 (₩990 시뮬레이션)"}
            </button>
            {isPremiumUser && <p>프리미엄 기능이 활성화되었습니다. 재수강 시뮬레이터에서 더 많은 과목을 선택할 수 있습니다.</p>}
          </section>
        </>
      )}
    </div>
  );
}

export default App;
