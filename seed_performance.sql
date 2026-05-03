-- Seed Questions
INSERT INTO performance_question (text, active) VALUES 
('I prefer to work with this employee', true),
('This employee consistently meets their deadlines', true),
('This employee demonstrates strong problem-solving skills', true),
('This employee communicates effectively with the team', true),
('This employee takes initiative in their tasks', true);

-- Add some attendance for Charlie (Employee) and Bob (Manager) for May 2026
-- Assuming IDs: Alice(1), Bob(2), Charlie(3), Diana(4)
-- We'll use IDs 2, 3, 4

INSERT INTO attendance (employee_id, work_date, morning_in, lunch_out, afternoon_in, evening_out) VALUES
(3, '2026-05-01', '08:00:00', '12:00:00', '13:00:00', '17:00:00'),
(3, '2026-05-02', '08:30:00', '12:30:00', '13:30:00', '17:30:00'),
(3, '2026-05-03', '08:00:00', '12:00:00', '13:00:00', '17:00:00'),
(4, '2026-05-01', '09:00:00', '12:00:00', '13:00:00', '18:00:00'),
(4, '2026-05-02', '09:00:00', '12:00:00', '13:00:00', '18:00:00');

-- Link Managers (Bob manages Charlie and Diana)
UPDATE employee SET manager_id = 2 WHERE id IN (3, 4);
UPDATE employee SET manager_id = 1 WHERE id = 2; -- Alice manages Bob
