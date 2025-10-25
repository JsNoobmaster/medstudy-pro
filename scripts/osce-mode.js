        let currentStation = null;
        let checklist = [];
        let timerInterval = null;
        let startTime = null;
        let timeLimit = 480; // seconds
        let completedSteps = new Set();

        const stations = {
            cvs: {
                name: 'Cardiovascular Examination',
                time: 480,
                scenario: 'You are asked to examine a 55-year-old male patient who presents with shortness of breath and chest discomfort. Please perform a complete cardiovascular examination.',
                checklist: [
                    { text: 'Introduce yourself and obtain consent', points: 2 },
                    { text: 'Wash hands and ensure patient privacy', points: 2 },
                    { text: 'Position patient at 45 degrees', points: 1 },
                    { text: 'General inspection - appearance, distress, cyanosis', points: 2 },
                    { text: 'Examine hands - clubbing, splinter hemorrhages, capillary refill', points: 2 },
                    { text: 'Check radial pulse - rate, rhythm, character', points: 2 },
                    { text: 'Assess blood pressure in both arms', points: 2 },
                    { text: 'Examine face - malar flush, xanthelasma', points: 1 },
                    { text: 'Inspect neck - JVP assessment', points: 2 },
                    { text: 'Palpate carotid pulse (one side at a time)', points: 2 },
                    { text: 'Inspect precordium - scars, deformities, visible pulsations', points: 2 },
                    { text: 'Palpate apex beat - location and character', points: 2 },
                    { text: 'Palpate for heaves and thrills', points: 2 },
                    { text: 'Auscultate heart sounds - all four areas systematically', points: 3 },
                    { text: 'Listen for murmurs in sitting forward and left lateral positions', points: 2 },
                    { text: 'Auscultate carotid arteries for bruits', points: 1 },
                    { text: 'Examine peripheral pulses - femoral, popliteal, dorsalis pedis', points: 2 },
                    { text: 'Check for sacral and ankle edema', points: 2 },
                    { text: 'Thank patient and ensure comfort', points: 1 },
                    { text: 'Summarize findings to examiner', points: 2 }
                ]
            },
            resp: {
                name: 'Respiratory Examination',
                time: 480,
                scenario: 'A 45-year-old patient presents with chronic cough and dyspnea. Please perform a complete respiratory examination.',
                checklist: [
                    { text: 'Introduce yourself and obtain consent', points: 2 },
                    { text: 'Wash hands and expose chest appropriately', points: 2 },
                    { text: 'Position patient at 45 degrees', points: 1 },
                    { text: 'General inspection - respiratory distress, cyanosis, cachexia', points: 2 },
                    { text: 'Count respiratory rate', points: 2 },
                    { text: 'Examine hands - clubbing, tar staining, tremor', points: 2 },
                    { text: 'Check radial pulse', points: 1 },
                    { text: 'Examine face and mouth - central cyanosis, pursed lip breathing', points: 2 },
                    { text: 'Assess JVP', points: 1 },
                    { text: 'Palpate cervical lymph nodes', points: 2 },
                    { text: 'Inspect chest - shape, symmetry, scars, deformities', points: 2 },
                    { text: 'Assess chest expansion - anterior and posterior', points: 2 },
                    { text: 'Palpate for tracheal position', points: 2 },
                    { text: 'Assess tactile vocal fremitus', points: 2 },
                    { text: 'Percuss chest - compare both sides systematically', points: 3 },
                    { text: 'Auscultate breath sounds - all zones bilaterally', points: 3 },
                    { text: 'Assess vocal resonance', points: 2 },
                    { text: 'Check for ankle edema', points: 1 },
                    { text: 'Thank patient and ensure comfort', points: 1 },
                    { text: 'Summarize findings', points: 2 }
                ]
            },
            abdo: {
                name: 'Abdominal Examination',
                time: 480,
                scenario: 'A 60-year-old patient complains of abdominal pain and distension. Perform a complete abdominal examination.',
                checklist: [
                    { text: 'Introduce yourself and obtain consent', points: 2 },
                    { text: 'Wash hands and expose abdomen (nipples to knees)', points: 2 },
                    { text: 'Position patient flat with one pillow', points: 1 },
                    { text: 'General inspection - appearance, jaundice, cachexia', points: 2 },
                    { text: 'Inspect hands - clubbing, pallor, palmar erythema, Dupuytren', points: 2 },
                    { text: 'Check for flapping tremor (asterixis)', points: 1 },
                    { text: 'Examine arms - bruising, spider nevi', points: 1 },
                    { text: 'Inspect face - jaundice, xanthelasma', points: 1 },
                    { text: 'Examine mouth - angular stomatitis, glossitis', points: 1 },
                    { text: 'Inspect abdomen - contour, distension, visible peristalsis, scars', points: 2 },
                    { text: 'Ask about pain before palpation', points: 1 },
                    { text: 'Light palpation - all nine regions systematically', points: 2 },
                    { text: 'Deep palpation - masses, tenderness, guarding', points: 2 },
                    { text: 'Palpate for liver - start in RIF, move upward', points: 2 },
                    { text: 'Palpate for spleen - start in RIF, move to left', points: 2 },
                    { text: 'Ballot for kidneys bilaterally', points: 2 },
                    { text: 'Palpate for aortic pulsation', points: 1 },
                    { text: 'Percuss abdomen - identify areas of dullness', points: 2 },
                    { text: 'Test for shifting dullness if ascites suspected', points: 2 },
                    { text: 'Auscultate bowel sounds', points: 2 },
                    { text: 'Auscultate for renal bruits', points: 1 },
                    { text: 'Offer to examine hernial orifices and PR', points: 1 },
                    { text: 'Thank patient and ensure comfort', points: 1 },
                    { text: 'Summarize findings', points: 2 }
                ]
            },
            neuro: {
                name: 'Neurological Examination',
                time: 600,
                scenario: 'Perform a complete neurological examination on this patient presenting with weakness and numbness.',
                checklist: [
                    { text: 'Introduce yourself and obtain consent', points: 2 },
                    { text: 'Wash hands and position patient appropriately', points: 2 },
                    { text: 'General inspection - conscious level, posture, gait', points: 2 },
                    { text: 'Test CN I - smell (if indicated)', points: 1 },
                    { text: 'Test CN II - visual acuity, visual fields, fundoscopy', points: 3 },
                    { text: 'Test CN III, IV, VI - eye movements, pupils, ptosis', points: 3 },
                    { text: 'Test CN V - facial sensation and motor (jaw clench)', points: 2 },
                    { text: 'Test CN VII - facial expression, smile, frown', points: 2 },
                    { text: 'Test CN VIII - hearing (Rinne and Weber if needed)', points: 2 },
                    { text: 'Test CN IX, X - gag reflex, uvula deviation, say "Ahh"', points: 2 },
                    { text: 'Test CN XI - shoulder shrug, head turn', points: 2 },
                    { text: 'Test CN XII - tongue protrusion and movement', points: 2 },
                    { text: 'Upper limbs - inspect for wasting, fasciculations', points: 1 },
                    { text: 'Test upper limb tone', points: 2 },
                    { text: 'Test upper limb power - all major movements', points: 3 },
                    { text: 'Test upper limb reflexes - biceps, triceps, supinator', points: 2 },
                    { text: 'Test coordination - finger-nose test, rapid alternating', points: 2 },
                    { text: 'Test sensation - light touch, pinprick, proprioception', points: 3 },
                    { text: 'Lower limbs - inspect for wasting', points: 1 },
                    { text: 'Test lower limb tone', points: 2 },
                    { text: 'Test lower limb power - hip, knee, ankle movements', points: 3 },
                    { text: 'Test lower limb reflexes - knee, ankle, plantar', points: 2 },
                    { text: 'Test coordination - heel-shin test', points: 2 },
                    { text: 'Assess gait if appropriate', points: 2 },
                    { text: 'Thank patient and summarize findings', points: 2 }
                ]
            },
            musculo: {
                name: 'Musculoskeletal Examination',
                time: 480,
                scenario: 'Patient presents with joint pain. Perform GALS screening and focused joint examination.',
                checklist: [
                    { text: 'Introduce yourself and obtain consent', points: 2 },
                    { text: 'Wash hands', points: 1 },
                    { text: 'Ask screening questions - pain, stiffness, function', points: 2 },
                    { text: 'GALS: Observe from front - symmetry, deformities', points: 2 },
                    { text: 'GALS: Observe from side and behind', points: 1 },
                    { text: 'GALS: Hands - grip strength, fine movements', points: 2 },
                    { text: 'GALS: Arms - shoulder and elbow movements', points: 2 },
                    { text: 'GALS: Spine - flexion, extension, lateral flexion', points: 2 },
                    { text: 'GALS: Gait assessment', points: 2 },
                    { text: 'GALS: Legs - hip, knee movements', points: 2 },
                    { text: 'Focused exam: Look - inspect affected joint', points: 2 },
                    { text: 'Focused exam: Feel - temperature, effusion, tenderness', points: 3 },
                    { text: 'Focused exam: Move - active range of motion', points: 2 },
                    { text: 'Focused exam: Move - passive range of motion', points: 2 },
                    { text: 'Perform special tests relevant to joint', points: 2 },
                    { text: 'Examine joint above and below', points: 2 },
                    { text: 'Assess neurovascular status if appropriate', points: 1 },
                    { text: 'Thank patient and summarize findings', points: 2 }
                ]
            },
            history: {
                name: 'History Taking',
                time: 600,
                scenario: 'Patient presents with chest pain. Take a complete medical history.',
                checklist: [
                    { text: 'Introduce yourself and confirm patient identity', points: 2 },
                    { text: 'Explain purpose and obtain consent', points: 2 },
                    { text: 'Start with open question about presenting complaint', points: 2 },
                    { text: 'SOCRATES: Site of pain', points: 1 },
                    { text: 'SOCRATES: Onset - when, sudden/gradual', points: 2 },
                    { text: 'SOCRATES: Character of pain', points: 1 },
                    { text: 'SOCRATES: Radiation', points: 1 },
                    { text: 'SOCRATES: Associated symptoms', points: 2 },
                    { text: 'SOCRATES: Time course and duration', points: 1 },
                    { text: 'SOCRATES: Exacerbating factors', points: 1 },
                    { text: 'SOCRATES: Relieving factors', points: 1 },
                    { text: 'SOCRATES: Severity (pain score)', points: 1 },
                    { text: 'Ask about systemic symptoms', points: 1 },
                    { text: 'Past medical history - major illnesses', points: 2 },
                    { text: 'Past surgical history', points: 1 },
                    { text: 'Drug history - current medications', points: 2 },
                    { text: 'Ask about allergies', points: 2 },
                    { text: 'Family history - relevant conditions', points: 2 },
                    { text: 'Social history - smoking, alcohol, occupation', points: 2 },
                    { text: 'Living situation and support', points: 1 },
                    { text: 'Systems review - brief screening', points: 2 },
                    { text: 'ICE: Ideas - what patient thinks is wrong', points: 2 },
                    { text: 'ICE: Concerns - what worries them', points: 2 },
                    { text: 'ICE: Expectations - what they hope for', points: 2 },
                    { text: 'Summarize history back to patient', points: 2 },
                    { text: 'Thank patient and allow questions', points: 1 }
                ]
            }
        };

        function startStation(stationType) {
            currentStation = stations[stationType];
            checklist = [...currentStation.checklist];
            completedSteps.clear();
            timeLimit = currentStation.time;
            
            document.getElementById('stationSelection').classList.add('hidden');
            document.getElementById('osceSection').classList.remove('hidden');
            
            document.getElementById('stationName').textContent = currentStation.name;
            document.getElementById('scenarioText').textContent = currentStation.scenario;
            document.getElementById('totalSteps').textContent = checklist.length;
            
            displayChecklist();
            startTimer();
            updateProgress();
        }

        function displayChecklist() {
            const container = document.getElementById('checklistItems');
            container.innerHTML = checklist.map((item, index) => `
                <div class="checklist-item" onclick="toggleStep(${index})">
                    <div class="checkbox" id="checkbox-${index}"></div>
                    <div class="checklist-text">${item.text}</div>
                    <div class="checklist-points">${item.points} pts</div>
                </div>
            `).join('');
        }

        function toggleStep(index) {
            const item = document.querySelector(`.checklist-item:nth-child(${index + 1})`);
            const checkbox = document.getElementById(`checkbox-${index}`);
            
            if (completedSteps.has(index)) {
                completedSteps.delete(index);
                item.classList.remove('checked');
                checkbox.textContent = '';
            } else {
                completedSteps.add(index);
                item.classList.add('checked');
                checkbox.textContent = '✓';
            }
            
            updateProgress();
        }

        function updateProgress() {
            const completed = completedSteps.size;
            const total = checklist.length;
            const percentage = Math.round((completed / total) * 100);
            
            document.getElementById('completedCount').textContent = completed;
            document.getElementById('progressPercent').textContent = percentage + '%';
        }

        function startTimer() {
            startTime = Date.now();
            const timerDisplay = document.getElementById('timerDisplay');
            
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const remaining = Math.max(0, timeLimit - elapsed);
                
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (remaining < 60) {
                    timerDisplay.classList.add('warning');
                }
                
                if (remaining === 0) {
                    clearInterval(timerInterval);
                    alert('Time is up! Finishing station...');
                    finishStation();
                }
            }, 1000);
        }

        function finishStation() {
            clearInterval(timerInterval);
            
            const completed = completedSteps.size;
            const total = checklist.length;
            const missed = total - completed;
            const percentage = Math.round((completed / total) * 100);
            
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            document.getElementById('osceSection').classList.add('hidden');
            document.getElementById('resultsSection').classList.remove('hidden');
            
            document.getElementById('resultCompleted').textContent = completed;
            document.getElementById('resultMissed').textContent = missed;
            document.getElementById('resultTime').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Determine grade
            let grade, gradeClass;
            if (percentage >= 85) {
                grade = 'Excellent';
                gradeClass = 'grade-excellent';
            } else if (percentage >= 70) {
                grade = 'Good Pass';
                gradeClass = 'grade-good';
            } else if (percentage >= 50) {
                grade = 'Pass';
                gradeClass = 'grade-pass';
            } else {
                grade = 'Fail';
                gradeClass = 'grade-fail';
            }
            
            const gradeDisplay = document.getElementById('gradeDisplay');
            gradeDisplay.textContent = grade;
            gradeDisplay.className = 'performance-grade ' + gradeClass;
            
            // Generate feedback
            const feedbackList = document.getElementById('feedbackList');
            const feedback = [];
            
            if (percentage >= 85) {
                feedback.push('Outstanding performance! You demonstrated excellent clinical skills.');
            } else if (percentage >= 70) {
                feedback.push('Good performance overall. Keep practicing to achieve excellence.');
            } else if (percentage >= 50) {
                feedback.push('You passed but there is room for improvement.');
            } else {
                feedback.push('More practice needed. Review the key steps you missed.');
            }
            
            // Check for missed critical steps
            const missedSteps = [];
            checklist.forEach((step, index) => {
                if (!completedSteps.has(index) && step.points >= 2) {
                    missedSteps.push(step.text);
                }
            });
            
            if (missedSteps.length > 0) {
                feedback.push(`Key steps missed: ${missedSteps.slice(0, 3).join('; ')}`);
            }
            
            if (elapsed > timeLimit * 0.9) {
                feedback.push('Work on your time management. Try to complete steps more efficiently.');
            } else if (elapsed < timeLimit * 0.5) {
                feedback.push('Good time management! You finished with time to spare.');
            }
            
            if (completedSteps.has(0) && completedSteps.has(checklist.length - 1)) {
                feedback.push('Well done on starting with introduction and ending with summary.');
            }
            
            feedbackList.innerHTML = feedback.map(f => `<li>${f}</li>`).join('');
        }

        function resetStation() {
            if (confirm('Are you sure you want to reset? This will clear your progress.')) {
                completedSteps.clear();
                document.querySelectorAll('.checklist-item').forEach(item => {
                    item.classList.remove('checked');
                });
                document.querySelectorAll('.checkbox').forEach(cb => {
                    cb.textContent = '';
                });
                updateProgress();
                
                clearInterval(timerInterval);
                startTimer();
            }
        }

        function retryStation() {
            document.getElementById('resultsSection').classList.add('hidden');
            document.getElementById('osceSection').classList.remove('hidden');
            
            completedSteps.clear();
            displayChecklist();
            updateProgress();
            
            document.getElementById('timerDisplay').classList.remove('warning');
            startTimer();
        }

        function backToStations() {
            clearInterval(timerInterval);
            document.getElementById('osceSection').classList.add('hidden');
            document.getElementById('resultsSection').classList.add('hidden');
            document.getElementById('stationSelection').classList.remove('hidden');
        }