// Global variable to store parsed course data
let allCourses = [];
// Global variable to store indices of selected major courses
let majorCourseIndices = [];

// Grade to point mapping - updated to include FA
const gradePoints = {
    'A+': 4.5, 'A': 4.5, 'A0': 4.0,
    'B+': 3.5, 'B': 3.5, 'B0': 3.0,
    'C+': 2.5, 'C': 2.5, 'C0': 2.0,
    'D+': 1.5, 'D': 1.5, 'D0': 1.0,
    'F': 0.0,
    'FA': 0.0, // Added FA based on sample if it means Fail and affects GPA
    'P': -1, // Pass, to be excluded from GPA calculation
    'NP': -2, // Non-Pass, to be excluded from GPA calculation
    // Grades like 'I' (Incomplete) or 'W' (Withdrawal) would also be < 0 if they don't affect GPA
};

// Keywords to identify major courses from "이수구분"
const majorKeywords = ["전선", "전필", "전공선택", "전공필수", "학필"]; // "학필" for 학과필수 etc.

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('confirmMajorSelection').addEventListener('click', handleMajorSelectionConfirmation);
    document.getElementById('calculateRetakeGpa').addEventListener('click', handleRetakeGpaCalculation);
    document.getElementById('simulatePaymentButton').addEventListener('click', handleSimulatePayment);
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        alert("파일을 선택해주세요.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        try {
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            parseCourseData(jsonData);
        } catch (error) {
            console.error("Error processing file:", error);
            alert("파일 처리 중 오류가 발생했습니다. CSV 또는 XLSX 형식인지 확인해주세요.\n오류: " + error.message);
            resetUI();
        }
    };
    reader.onerror = function(error) {
        console.error("FileReader error:", error);
        alert("파일을 읽는 중 오류가 발생했습니다.");
        resetUI();
    };
    reader.readAsBinaryString(file);
}

function parseCourseData(data) {
    allCourses = [];
    let headerRowIndex = -1;
    let actualDataStartIndex = -1;

    // Find the header row. It should contain '교과목명', '학점', '등급'.
    // The sample shows headers might not be on the first row.
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row && row.includes('교과목명') && row.includes('학점') && row.includes('등급')) {
            headerRowIndex = i;
            actualDataStartIndex = i + 1;
            break;
        }
    }

    if (headerRowIndex === -1) {
        alert("필수 컬럼명('교과목명', '학점', '등급')을 포함한 헤더 행을 찾을 수 없습니다. 업로드한 파일의 형식을 확인해주세요.");
        resetUI();
        return;
    }

    const header = data[headerRowIndex].map(h => String(h).trim());

    // Get column indices based on specific names from the sample
    let nameCol = header.indexOf('교과목명');
    let creditCol = header.indexOf('학점');
    let gradeCol = header.indexOf('등급');
    let majorTypeCol = header.indexOf('이수구분'); // For "전선", "전필" etc.
    let evaluationTypeCol = header.indexOf('평가방식'); // For "P/NP"

    if (nameCol === -1 || creditCol === -1 || gradeCol === -1) {
        alert("필수 컬럼('교과목명', '학점', '등급') 중 일부를 헤더에서 찾을 수 없습니다. 파일 형식을 확인해주세요.");
        console.log("Detected header:", header);
        console.log(`Indices found: 교과목명-${nameCol}, 학점-${creditCol}, 등급-${gradeCol}`);
        resetUI();
        return;
    }

    // Check if data actually starts
    if (data.length <= actualDataStartIndex) {
        alert("헤더 행은 찾았으나, 실제 과목 데이터가 없습니다.");
        resetUI();
        return;
    }


    for (let i = actualDataStartIndex; i < data.length; i++) {
        const row = data[i];
        // Ensure row is not empty and has enough columns based on header
        if (!row || row.length < Math.max(nameCol, creditCol, gradeCol) + 1 || !row[nameCol]) {
            console.warn(`Skipping row ${i + 1} due to missing data or course name.`);
            continue; // Skip empty or malformed rows
        }

        const courseName = String(row[nameCol]).trim();
        const credits = parseFloat(row[creditCol]);
        let grade = String(row[gradeCol]).toUpperCase().trim();
        const majorType = majorTypeCol !== -1 && row[majorTypeCol] ? String(row[majorTypeCol]).trim() : "";
        const evalType = evaluationTypeCol !== -1 && row[evaluationTypeCol] ? String(row[evaluationTypeCol]).trim() : "";

        // If grade is empty or seems like a placeholder, skip (e.g. for courses in progress)
        if (!grade) {
            console.warn(`Skipping row ${i + 1} ('${courseName}') due to empty grade.`);
            continue;
        }

        // Additional check for P/NP based on evalType if grade itself isn't P/NP
        if (evalType.toUpperCase() === 'P/NP' && (grade === 'P' || grade === 'PASS')) {
            grade = 'P';
        } else if (evalType.toUpperCase() === 'P/NP' && (grade === 'NP' || grade === 'FAIL' || grade === 'NON-PASS')) {
            grade = 'NP';
        }


        if (courseName && !isNaN(credits) && credits >= 0 && gradePoints[grade] !== undefined) { // Allow 0 credit courses for P/NP like KMOOC
            let isMajor = false;
            if (majorType) {
                isMajor = majorKeywords.some(keyword => majorType.includes(keyword));
            }

            allCourses.push({
                name: courseName,
                credits: credits,
                grade: grade,
                originalGrade: grade,
                isMajor: isMajor,
                majorType: majorType // Store for display if needed
            });
        } else {
            console.warn(`Skipping row ${i + 1} ('${courseName}') due to invalid data: Credits='${row[creditCol]}', Grade='${grade}', GradePoint='${gradePoints[grade]}'`);
        }
    }

    if (allCourses.length === 0) {
        alert("파일에서 유효한 과목 데이터를 추출하지 못했습니다. 파일 내용과 형식을 다시 확인해주세요.");
        resetUI();
        return;
    }

    console.log("Parsed courses:", allCourses);
    populateMajorSelectionUI(allCourses); // This function will now use pre-checked majors
    document.getElementById('major-selection-section').style.display = 'block';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('retake-simulation-section').style.display = 'none';
    document.getElementById('premium-feature-section').style.display = 'none';
}

function resetUI() {
    allCourses = [];
    majorCourseIndices = [];
    document.getElementById('fileInput').value = ''; // Clear file input
    document.getElementById('major-selection-section').style.display = 'none';
    document.getElementById('course-list-for-major').innerHTML = '';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('overallGpa').textContent = 'N/A';
    document.getElementById('majorGpa').textContent = 'N/A';
    document.getElementById('retake-simulation-section').style.display = 'none';
    document.getElementById('retake-course-selector-container').innerHTML = '';
    document.getElementById('retakeOverallGpa').textContent = 'N/A';
    document.getElementById('retakeMajorGpa').textContent = 'N/A';
    document.getElementById('premium-feature-section').style.display = 'none';
    // Reset premium section if it was more complex
}


function populateMajorSelectionUI(courses) {
    const courseListDiv = document.getElementById('course-list-for-major');
    courseListDiv.innerHTML = ''; // Clear previous entries
    courses.forEach((course, index) => {
        const courseDiv = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `major-course-${index}`;
        checkbox.value = index; // Store course index
        checkbox.checked = course.isMajor; // Pre-check if auto-identified as major

        const label = document.createElement('label');
        label.htmlFor = `major-course-${index}`;
        label.textContent = `${course.name} (${course.credits}학점, ${course.grade}) - 이수구분: ${course.majorType || 'N/A'}`;

        courseDiv.appendChild(checkbox);
        courseDiv.appendChild(label);
        courseListDiv.appendChild(courseDiv);
    });
}

function handleMajorSelectionConfirmation() {
    majorCourseIndices = [];
    const checkboxes = document.querySelectorAll('#course-list-for-major input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const courseIndex = parseInt(checkbox.value);
            allCourses[courseIndex].isMajor = true;
            majorCourseIndices.push(courseIndex);
        } else {
            // Ensure isMajor is false if unchecked after a re-upload or similar scenario
            const courseIndex = parseInt(checkbox.value);
            if(allCourses[courseIndex]) allCourses[courseIndex].isMajor = false;
        }
    });

    console.log("Confirmed major courses. Indices:", majorCourseIndices);
    console.log("Updated allCourses with major info:", allCourses);

    calculateAndDisplayGPAs();

    document.getElementById('results-section').style.display = 'block';
    document.getElementById('retake-simulation-section').style.display = 'block';
    document.getElementById('premium-feature-section').style.display = 'block';

    populateRetakeSelectors(allCourses);
}

function calculateGPA(courses, isMajorOnly = false) {
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
        if (isMajorOnly && !course.isMajor) {
            return; // Skip non-major courses if calculating major GPA
        }

        const point = gradePoints[course.grade];
        if (point >= 0) { // Exclude P/NP grades (negative values)
            totalPoints += point * course.credits;
            totalCredits += course.credits;
        }
    });

    if (totalCredits === 0) return 0.0;
    return (totalPoints / totalCredits).toFixed(2);
}

function calculateAndDisplayGPAs() {
    const overallGpa = calculateGPA(allCourses);
    const majorGpa = calculateGPA(allCourses.filter(c => c.isMajor), true); // Pass only major courses, or filter within function

    document.getElementById('overallGpa').textContent = overallGpa;
    document.getElementById('majorGpa').textContent = majorGpa;
}


function populateRetakeSelectors(courses) {
    const container = document.getElementById('retake-course-selector-container');
    container.innerHTML = ''; // Clear previous

    for (let i = 0; i < 2; i++) { // Max 2 for free tier
        const selectorDiv = document.createElement('div');
        selectorDiv.style.marginBottom = '10px';

        const select = document.createElement('select');
        select.id = `retake-course-${i}`;
        select.className = 'retake-course-select';

        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = `재수강 과목 ${i + 1} 선택`;
        select.appendChild(defaultOption);

        courses.forEach((course, index) => {
            // Only allow retaking courses that are not P/NP
            if (gradePoints[course.grade] >= 0) {
                const option = document.createElement('option');
                option.value = index; // Store index of the course in allCourses
                option.textContent = `${course.name} (현재 ${course.grade}, ${course.credits}학점)`;
                select.appendChild(option);
            }
        });

        const gradeInput = document.createElement('input');
        gradeInput.type = 'text';
        gradeInput.placeholder = '새 성적 (예: A+)';
        gradeInput.id = `retake-grade-${i}`;
        gradeInput.className = 'retake-grade-input';
        gradeInput.style.marginLeft = '10px';

        selectorDiv.appendChild(select);
        selectorDiv.appendChild(gradeInput);
        container.appendChild(selectorDiv);
    }
}


function handleRetakeGpaCalculation() {
    const simulatedCourses = JSON.parse(JSON.stringify(allCourses)); // Deep copy

    const courseSelectors = document.querySelectorAll('#retake-course-selector-container .retake-course-select');
    const gradeInputs = document.querySelectorAll('#retake-course-selector-container .retake-grade-input');
    let coursesToRetakeValid = true;
    let selectedIndices = new Set();


    for (let i = 0; i < courseSelectors.length; i++) {
        const courseIndexStr = courseSelectors[i].value;
        const newGrade = gradeInputs[i].value.toUpperCase().trim();

        if (courseIndexStr) { // If a course is selected
            if (!newGrade || gradePoints[newGrade] === undefined) {
                alert(`과목 "${simulatedCourses[parseInt(courseIndexStr)].name}"의 새 성적이 유효하지 않습니다.`);
                coursesToRetakeValid = false;
                break;
            }
            if (gradePoints[newGrade] < 0) {
                 alert(`재수강 성적으로 P/NP를 입력할 수 없습니다.`);
                coursesToRetakeValid = false;
                break;
            }

            const courseIndex = parseInt(courseIndexStr);
            if (selectedIndices.has(courseIndex)) {
                alert("동일한 과목을 중복하여 재수강 대상으로 선택할 수 없습니다.");
                coursesToRetakeValid = false;
                break;
            }
            selectedIndices.add(courseIndex);

            // Apply the new grade for simulation
            // In a real system, you'd need to handle how retakes affect old grades (e.g., grade replacement)
            // For simplicity, we assume the new grade replaces the old one for GPA calculation purposes.
            // More complex: some systems average, some take higher, some replace only if higher.
            // Here, we assume replacement.
            simulatedCourses[courseIndex].grade = newGrade;
        }
    }

    if (!coursesToRetakeValid) {
        document.getElementById('retakeOverallGpa').textContent = 'N/A';
        document.getElementById('retakeMajorGpa').textContent = 'N/A';
        return;
    }

    console.log("Simulating with courses:", simulatedCourses);

    const retakeOverallGpa = calculateGPA(simulatedCourses);
    const retakeMajorGpa = calculateGPA(simulatedCourses.filter(c => c.isMajor), true);

    document.getElementById('retakeOverallGpa').textContent = retakeOverallGpa;
    document.getElementById('retakeMajorGpa').textContent = retakeMajorGpa;
}


// Global variable to track premium status
let isPremiumUser = false;

// --- Functions for Premium Features ---
function handleSimulatePayment() {
    if (isPremiumUser) {
        alert("이미 프리미엄 기능이 활성화되어 있습니다.");
        return;
    }
    // Simulate payment confirmation
    const confirmPayment = confirm("프리미엄 기능을 구매하시겠습니까? (₩990 - 시뮬레이션)");
    if (confirmPayment) {
        isPremiumUser = true;
        console.log("Payment simulated. User is now premium.");
        alert("프리미엄 기능이 활성화되었습니다! 이제 3개 이상의 과목을 선택하여 재수강 시뮬레이션 할 수 있습니다.");

        const simulatePaymentButton = document.getElementById('simulatePaymentButton');
        simulatePaymentButton.textContent = "프리미엄 활성화됨";
        simulatePaymentButton.disabled = true;

        const premiumRetakeContainer = document.getElementById('premium-retake-course-selector-container');
        premiumRetakeContainer.style.display = 'block';

        // Hide the free tier retake section if premium is active, or adjust UI as needed
        // document.getElementById('retake-simulation-section').style.display = 'none';

        // Populate the premium selectors (implementation in next step)
        populatePremiumRetakeSelectors(allCourses);
    } else {
        alert("프리미엄 기능 활성화가 취소되었습니다.");
    }
}

function populatePremiumRetakeSelectors(courses) {
    const container = document.getElementById('premium-retake-course-selector-container');
    if (!container) return;

    // Preserve the introductory paragraph if it exists, or add it.
    let introParagraph = container.querySelector('p');
    if (!introParagraph) {
        introParagraph = document.createElement('p');
        introParagraph.textContent = "프리미엄 사용자는 여기에서 최대 5개의 재수강 과목을 선택할 수 있습니다.";
    }

    container.innerHTML = ''; // Clear previous content
    container.appendChild(introParagraph); // Add back the paragraph

    const selectorsDiv = document.createElement('div');
    selectorsDiv.id = 'premium-selectors-go-here';

    const maxPremiumRetakes = 5; // Allow up to 5 retakes for premium users

    for (let i = 0; i < maxPremiumRetakes; i++) {
        const selectorDiv = document.createElement('div');
        selectorDiv.style.marginBottom = '10px';

        const select = document.createElement('select');
        select.id = `premium-retake-course-${i}`;
        select.className = 'premium-retake-course-select';

        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = `프리미엄 재수강 과목 ${i + 1} 선택`;
        select.appendChild(defaultOption);

        courses.forEach((course, index) => {
            if (gradePoints[course.grade] >= 0) { // Only allow retaking courses not P/NP
                const option = document.createElement('option');
                option.value = index; // Store index of the course in allCourses
                option.textContent = `${course.name} (현재 ${course.grade}, ${course.credits}학점)`;
                select.appendChild(option);
            }
        });

        const gradeInput = document.createElement('input');
        gradeInput.type = 'text';
        gradeInput.placeholder = '새 성적 (예: A0)';
        gradeInput.id = `premium-retake-grade-${i}`;
        gradeInput.className = 'premium-retake-grade-input';
        gradeInput.style.marginLeft = '10px';

        selectorDiv.appendChild(select);
        selectorDiv.appendChild(gradeInput);
        selectorsDiv.appendChild(selectorDiv);
    }
    container.appendChild(selectorsDiv);

    let calcButton = document.getElementById('calculatePremiumRetakeGpa');
    if (!calcButton) {
        calcButton = document.createElement('button');
        calcButton.id = 'calculatePremiumRetakeGpa';
        calcButton.textContent = '프리미엄 재수강 평점 계산';
        container.appendChild(calcButton);
    }
    // Ensure event listener is attached, potentially re-attaching if button was recreated
    calcButton.removeEventListener('click', handlePremiumRetakeGpaCalculation); // Remove old if any
    calcButton.addEventListener('click', handlePremiumRetakeGpaCalculation);

    console.log("Premium retake selectors populated for up to 5 courses.");
}


function handlePremiumRetakeGpaCalculation() {
    if (!isPremiumUser) {
        alert("이 기능은 프리미엄 사용자 전용입니다. '프리미엄 기능 활성화' 버튼을 클릭하여 활성화해주세요.");
        return;
    }

    const simulatedCourses = JSON.parse(JSON.stringify(allCourses)); // Deep copy

    const courseSelectors = document.querySelectorAll('#premium-retake-course-selector-container .premium-retake-course-select');
    const gradeInputs = document.querySelectorAll('#premium-retake-course-selector-container .premium-retake-grade-input');
    let coursesToRetakeValid = true;
    let selectedIndices = new Set();
    let retakeCount = 0;

    for (let i = 0; i < courseSelectors.length; i++) {
        const courseIndexStr = courseSelectors[i].value;
        const newGrade = gradeInputs[i].value.toUpperCase().trim();

        if (courseIndexStr) { // If a course is selected
            retakeCount++;
            if (!newGrade || gradePoints[newGrade] === undefined) {
                alert(`과목 "${simulatedCourses[parseInt(courseIndexStr)].name}"의 새 성적이 유효하지 않습니다.`);
                coursesToRetakeValid = false;
                break;
            }
            if (gradePoints[newGrade] < 0) {
                 alert(`재수강 성적으로 P/NP를 입력할 수 없습니다.`);
                coursesToRetakeValid = false;
                break;
            }

            const courseIndex = parseInt(courseIndexStr);
            if (selectedIndices.has(courseIndex)) {
                alert("동일한 과목을 중복하여 재수강 대상으로 선택할 수 없습니다.");
                coursesToRetakeValid = false;
                break;
            }
            selectedIndices.add(courseIndex);
            simulatedCourses[courseIndex].grade = newGrade;
        }
    }

    if (!coursesToRetakeValid) {
        // Display N/A or keep old values for retake GPAs if validation fails
        document.getElementById('retakeOverallGpa').textContent = 'N/A (프리미엄 오류)';
        document.getElementById('retakeMajorGpa').textContent = 'N/A (프리미엄 오류)';
        return;
    }

    if (retakeCount === 0) {
        alert("재수강할 과목을 하나 이상 선택해주세요.");
        // Optionally reset or clear premium GPA display if no courses are selected for retake
        document.getElementById('retakeOverallGpa').textContent = calculateGPA(allCourses); // Show original overall GPA
        document.getElementById('retakeMajorGpa').textContent = calculateGPA(allCourses.filter(c => c.isMajor), true); // Show original major GPA
        return;
    }

    console.log("Simulating premium retake with courses:", simulatedCourses);

    const retakeOverallGpa = calculateGPA(simulatedCourses);
    const retakeMajorGpa = calculateGPA(simulatedCourses.filter(c => c.isMajor), true);

    // Update the main GPA display areas. Could also add specific "Premium Retake GPA" fields if desired.
    document.getElementById('retakeOverallGpa').textContent = `${retakeOverallGpa} (프리미엄)`;
    document.getElementById('retakeMajorGpa').textContent = `${retakeMajorGpa} (프리미엄)`;

    alert(`프리미엄 재수강 시뮬레이션 완료: ${retakeCount}개 과목 재수강 적용`);
}
// --- End Functions for Premium Features ---

// Modify resetUI to also reset premium status for a full reset
function resetUI() {
    allCourses = [];
    majorCourseIndices = [];
    isPremiumUser = false; // Reset premium status

    document.getElementById('fileInput').value = '';
    document.getElementById('major-selection-section').style.display = 'none';
    document.getElementById('course-list-for-major').innerHTML = '';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('overallGpa').textContent = 'N/A';
    document.getElementById('majorGpa').textContent = 'N/A';

    document.getElementById('retake-simulation-section').style.display = 'none';
    document.getElementById('retake-course-selector-container').innerHTML = '';
    document.getElementById('retakeOverallGpa').textContent = 'N/A';
    document.getElementById('retakeMajorGpa').textContent = 'N/A';

    document.getElementById('premium-feature-section').style.display = 'none';
    const premiumRetakeContainer = document.getElementById('premium-retake-course-selector-container');
    premiumRetakeContainer.style.display = 'none';
    premiumRetakeContainer.innerHTML = ''; // Clear its content

    const simulatePaymentButton = document.getElementById('simulatePaymentButton');
    simulatePaymentButton.textContent = "프리미엄 기능 활성화 (₩990 시뮬레이션)";
    simulatePaymentButton.disabled = false;
}


console.log("script.js loaded. Event listeners active.");
