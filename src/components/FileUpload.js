import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // Using 'xlsx' directly, assuming it's installed

// Constants defined in App.js, passed as props or redefined if preferred scope
// For simplicity here, we might redefine or expect them if this component grows complex.
// const gradePoints = { ... };
// const majorKeywords = [...];

function FileUpload({ onCoursesParsed, gradePointsMapping, majorKeywordsArray }) {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setError("파일을 선택해주세요.");
      setFileName('');
      onCoursesParsed([], true); // Reset courses with error
      return;
    }

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        parseCourseDataAndCallback(jsonData);

      } catch (err) {
        console.error("Error processing file:", err);
        setError("파일 처리 중 오류가 발생했습니다. XLSX 또는 CSV 형식인지 확인해주세요. 오류: " + err.message);
        onCoursesParsed([], true); // Reset courses with error
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setError("파일을 읽는 중 오류가 발생했습니다.");
      onCoursesParsed([], true); // Reset courses with error
    };
    reader.readAsBinaryString(file);
  };

  const parseCourseDataAndCallback = (data) => {
    let parsedCourses = [];
    let headerRowIndex = -1;
    let actualDataStartIndex = -1;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && Array.isArray(row) && row.includes('교과목명') && row.includes('학점') && row.includes('등급')) {
        headerRowIndex = i;
        actualDataStartIndex = i + 1;
        break;
      }
    }

    if (headerRowIndex === -1) {
      setError("필수 컬럼명('교과목명', '학점', '등급')을 포함한 헤더 행을 찾을 수 없습니다.");
      onCoursesParsed([], true);
      return;
    }

    const header = data[headerRowIndex].map(h => String(h || '').trim());

    let nameCol = header.indexOf('교과목명');
    let creditCol = header.indexOf('학점');
    let gradeCol = header.indexOf('등급');
    let majorTypeCol = header.indexOf('이수구분');
    let evaluationTypeCol = header.indexOf('평가방식');

    if (nameCol === -1 || creditCol === -1 || gradeCol === -1) {
      setError("필수 컬럼('교과목명', '학점', '등급') 중 일부를 헤더에서 찾을 수 없습니다.");
      onCoursesParsed([], true);
      return;
    }

    if (data.length <= actualDataStartIndex) {
      setError("헤더 행은 찾았으나, 실제 과목 데이터가 없습니다.");
      onCoursesParsed([], true);
      return;
    }

    for (let i = actualDataStartIndex; i < data.length; i++) {
      const row = data[i];
      if (!row || !Array.isArray(row) || row.length < Math.max(nameCol, creditCol, gradeCol) + 1 || !row[nameCol]) {
        console.warn(`Skipping row ${i + 1} due to missing data or course name.`);
        continue;
      }

      const courseName = String(row[nameCol] || '').trim();
      const creditsText = String(row[creditCol] || '0').trim();
      const credits = parseFloat(creditsText);
      let grade = String(row[gradeCol] || '').toUpperCase().trim();
      const majorType = majorTypeCol !== -1 && row[majorTypeCol] ? String(row[majorTypeCol]).trim() : "";
      const evalType = evaluationTypeCol !== -1 && row[evaluationTypeCol] ? String(row[evaluationTypeCol]).trim() : "";

      if (!courseName) { // Skip if course name is empty, even if other fields might exist
          console.warn(`Skipping row ${i + 1} due to empty course name.`);
          continue;
      }
      if (!grade && evalType.toUpperCase() !== 'P/NP') { // Allow P/NP even if grade is initially empty if evalType indicates it
          console.warn(`Skipping row ${i + 1} ('${courseName}') due to empty grade for a non-P/NP course.`);
          continue;
      }

      if (evalType.toUpperCase() === 'P/NP') {
        if (grade === 'P' || grade === 'PASS' || grade === '') grade = 'P'; // Default empty P/NP to P
        else if (grade === 'NP' || grade === 'FAIL' || grade === 'NON-PASS') grade = 'NP';
        // If grade is something else but evalType is P/NP, it might be an error in data or needs clarification.
        // For now, we trust the grade if it's P or NP, otherwise, it might be an issue.
      }

      // Use gradePointsMapping passed from App.js
      if (!isNaN(credits) && credits >= 0 && gradePointsMapping && gradePointsMapping[grade] !== undefined) {
        let isMajor = false;
        if (majorType && majorKeywordsArray) {
          isMajor = majorKeywordsArray.some(keyword => majorType.includes(keyword));
        }
        parsedCourses.push({
          // id will be added in App component
          name: courseName,
          credits: credits,
          grade: grade,
          originalGrade: grade,
          isMajor: isMajor,
          majorType: majorType,
        });
      } else {
        console.warn(`Skipping row ${i + 1} ('${courseName}') due to invalid data: Credits='${creditsText}', Grade='${grade}', GradePoint Lookup='${gradePointsMapping ? gradePointsMapping[grade] : 'N/A'}'`);
      }
    }

    if (parsedCourses.length === 0 && !error) { // if no courses but also no prior error
      setError("파일에서 유효한 과목 데이터를 추출하지 못했습니다. 파일 내용과 형식을 다시 확인해주세요.");
      onCoursesParsed([], true); // true indicates an error state for parsing
    } else if (error) { // If an error was already set (e.g. header not found)
      onCoursesParsed([], true);
    }
    else {
      onCoursesParsed(parsedCourses, false); // false indicates no error from parsing itself
    }
  };

  return (
    <div>
      <input
        type="file"
        id="fileInput"
        accept=".xlsx, .csv"
        onChange={handleFileUpload}
        style={{ display: 'block', margin: '10px 0' }}
      />
      {fileName && <p style={{ fontSize: '0.9em', color: '#555' }}>선택된 파일: {fileName}</p>}
      {error && <p style={{ color: 'red', fontSize: '0.9em' }}>{error}</p>}
    </div>
  );
}

export default FileUpload;
