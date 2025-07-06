import React from 'react';

function CourseList({ courses, onMajorChange }) {
  if (!courses || courses.length === 0) {
    return <p>표시할 과목이 없거나 아직 파일이 업로드되지 않았습니다.</p>;
  }

  const handleCheckboxChange = (event, courseId) => {
    onMajorChange(courseId, event.target.checked);
  };

  return (
    <div className="course-list">
      <p style={{ marginBottom: '15px', fontStyle: 'italic' }}>
        아래 목록에서 전공 과목을 선택/해제할 수 있습니다. '이수구분'을 참고하여 자동으로 선택된 항목들을 확인해주세요.
      </p>
      <table>
        <thead>
          <tr>
            <th>전공</th>
            <th>과목명</th>
            <th>학점</th>
            <th>등급</th>
            <th>이수구분</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id || course.name}> {/* Fallback to name if id is somehow missing, though App.js should add it */}
              <td>
                <input
                  type="checkbox"
                  checked={course.isMajor}
                  onChange={(e) => handleCheckboxChange(e, course.id)}
                  aria-label={`Toggle major status for ${course.name}`}
                />
              </td>
              <td>{course.name}</td>
              <td>{course.credits}</td>
              <td>{course.grade}</td>
              <td>{course.majorType || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CourseList;
