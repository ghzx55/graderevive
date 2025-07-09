// MainPage.js 안에서 사용할 수 있도록 전체 Retake Simulation UI 컴포넌트를 구현합니다.

import React from "react";
import GpaDisplay from "../components/GpaDisplay"; // 이미 있는 컴포넌트라고 가정

function RetakeSimulationSection({
  originalCourses,
  isPremium,
  onSimulate,
  onReset,
  retakeOverallGpa,
  retakeMajorGpa,
  isRetakeCalculated
}) {
  const [selectedCourses, setSelectedCourses] = React.useState([]);

  const handleGradeChange = (courseId, newGrade) => {
    setSelectedCourses(prev =>
      prev.map(course =>
        course.id === courseId ? { ...course, grade: newGrade } : course
      )
    );
  };

  const handleSelectCourse = (course) => {
    const alreadySelected = selectedCourses.find(c => c.id === course.id);
    if (alreadySelected) {
      setSelectedCourses(prev => prev.filter(c => c.id !== course.id));
    } else {
      if (!isPremium && selectedCourses.length >= 2) {
        alert("무료 사용자는 최대 2개 과목만 선택할 수 있습니다.");
        return;
      }
      setSelectedCourses(prev => [...prev, { ...course }]);
    }
  };

  const handleSimulate = () => {
    const updatedCourses = originalCourses.map(course => {
      const found = selectedCourses.find(c => c.id === course.id);
      return found ? { ...course, grade: found.grade } : course;
    });
    onSimulate(updatedCourses);
  };

  return (
    <section id="retake-simulation-section">
      <h2>재수강 시뮬레이션</h2>

      <table>
        <thead>
          <tr>
            <th>선택</th>
            <th>과목명</th>
            <th>기존 평점</th>
            <th>재수강 평점</th>
          </tr>
        </thead>
        <tbody>
          {originalCourses.map(course => {
            const selected = selectedCourses.find(c => c.id === course.id);
            return (
              <tr key={course.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => handleSelectCourse(course)}
                  />
                </td>
                <td>{course.name}</td>
                <td>{course.grade}</td>
                <td>
                  {selected ? (
                    <select
                      value={selected.grade}
                      onChange={e => handleGradeChange(course.id, e.target.value)}
                    >
                      {Object.keys({ A: 4.5, B: 3.5, C: 2.5, D: 1.5, F: 0.0 }).map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleSimulate}>시뮬레이션 실행</button>
        <button onClick={onReset} style={{ marginLeft: "10px" }}>초기화</button>
      </div>

      {isRetakeCalculated && (
        <div style={{ marginTop: "20px" }}>
          <h3>재수강 후 예상 평점</h3>
          <GpaDisplay label="전체 총평점" gpa={retakeOverallGpa} isRetake={true} />
          <GpaDisplay label="전공 총평점" gpa={retakeMajorGpa} isRetake={true} />
        </div>
      )}
    </section>
  );
}

export default RetakeSimulationSection;
