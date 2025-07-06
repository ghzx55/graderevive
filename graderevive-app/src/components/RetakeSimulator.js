import React, { useState, useEffect } from 'react';

function RetakeSimulator({ originalCourses, onSimulate, onReset, isPremium, gradePointsMapping }) {
  const MAX_FREE_RETAKES = 2;
  const MAX_PREMIUM_RETAKES = 5;

  const [selectedRetakes, setSelectedRetakes] = useState([]);
  const [availableCoursesForRetake, setAvailableCoursesForRetake] = useState([]);

  useEffect(() => {
    // Filter courses eligible for retake (must have a GPA-affecting grade)
    // and sort them, perhaps alphabetically or by original grade
    const filtered = originalCourses
      .filter(course => gradePointsMapping[course.originalGrade] >= 0) // Only GPA-affecting grades
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
    setAvailableCoursesForRetake(filtered);

    // Initialize selectedRetakes based on allowed number
    const maxRetakes = isPremium ? MAX_PREMIUM_RETAKES : MAX_FREE_RETAKES;
    const initialRetakes = Array(maxRetakes).fill({ courseId: '', newGrade: '' });
    setSelectedRetakes(initialRetakes);

  }, [originalCourses, isPremium, gradePointsMapping]); // Re-run if original courses or premium status change

  const handleCourseChange = (index, courseId) => {
    const newRetakes = [...selectedRetakes];
    newRetakes[index] = { ...newRetakes[index], courseId: courseId };
    setSelectedRetakes(newRetakes);
  };

  const handleGradeChange = (index, newGrade) => {
    const newRetakes = [...selectedRetakes];
    newRetakes[index] = { ...newRetakes[index], newGrade: newGrade.toUpperCase() };
    setSelectedRetakes(newRetakes);
  };

  const handleSubmitSimulation = () => {
    const coursesToSimulate = JSON.parse(JSON.stringify(originalCourses)); // Deep copy
    let isValid = true;
    const chosenIndicesInSimulation = new Set(); // To check for duplicate selections in the UI

    selectedRetakes.forEach((retake, index) => {
      if (retake.courseId) { // If a course is selected for this slot
        if (!retake.newGrade || gradePointsMapping[retake.newGrade] === undefined || gradePointsMapping[retake.newGrade] < 0) {
          alert(`선택 ${index + 1}의 새 성적이 유효하지 않습니다. (P/NP 불가)`);
          isValid = false;
          return;
        }

        const originalCourseIndex = originalCourses.findIndex(c => c.id === retake.courseId);
        if (originalCourseIndex === -1) { // Should not happen if UI is correct
            alert(`선택 ${index + 1}에서 유효하지 않은 과목이 선택되었습니다.`);
            isValid = false;
            return;
        }

        if (chosenIndicesInSimulation.has(originalCourseIndex)) {
            alert(`과목 "${originalCourses[originalCourseIndex].name}"이(가) 중복 선택되었습니다.`);
            isValid = false;
            return;
        }
        chosenIndicesInSimulation.add(originalCourseIndex);

        // Find the course in our simulation copy and update its grade
        const courseInSimulation = coursesToSimulate.find(c => c.id === retake.courseId);
        if (courseInSimulation) {
          courseInSimulation.grade = retake.newGrade;
        }
      }
    });

    if (isValid) {
      if (chosenIndicesInSimulation.size === 0) {
        alert("재수강할 과목을 하나 이상 선택하고 새 성적을 입력해주세요.");
        return;
      }
      onSimulate(coursesToSimulate);
    }
  };

  const maxSlots = isPremium ? MAX_PREMIUM_RETAKES : MAX_FREE_RETAKES;

  return (
    <div>
      <p style={{ fontSize: '0.9em', fontStyle: 'italic', marginBottom: '15px' }}>
        재수강할 과목을 선택하고 새로운 예상 등급을 입력하세요. (P/NP 과목은 재수강 시뮬레이션에서 제외됩니다)
        {isPremium ? ` 프리미엄 사용자는 최대 ${MAX_PREMIUM_RETAKES}개까지 선택 가능합니다.` : ` 최대 ${MAX_FREE_RETAKES}개까지 선택 가능합니다.`}
      </p>
      {selectedRetakes.slice(0, maxSlots).map((retake, index) => (
        <div key={index} className="retake-selector">
          <label htmlFor={`retake-course-${index}`} style={{ marginRight: '5px' }}>과목 {index + 1}:</label>
          <select
            id={`retake-course-${index}`}
            value={retake.courseId}
            onChange={(e) => handleCourseChange(index, e.target.value)}
          >
            <option value="">-- 과목 선택 --</option>
            {availableCoursesForRetake.map((course) => (
              <option key={course.id} value={course.id} disabled={selectedRetakes.some(sr => sr.courseId === course.id && sr.courseId !== retake.courseId)}>
                {course.name} (현재: {course.originalGrade}, {course.credits}학점)
              </option>
            ))}
          </select>
          <input
            type="text"
            id={`retake-grade-${index}`}
            value={retake.newGrade}
            onChange={(e) => handleGradeChange(index, e.target.value)}
            placeholder="새 등급 (예: A+)"
            disabled={!retake.courseId} // Disable grade input if no course is selected
          />
        </div>
      ))}
      <button onClick={handleSubmitSimulation}>재수강 결과 계산</button>
      <button onClick={onReset} style={{ marginLeft: '10px', backgroundColor: '#7f8c8d' }}>시뮬레이션 초기화</button>
    </div>
  );
}

export default RetakeSimulator;
