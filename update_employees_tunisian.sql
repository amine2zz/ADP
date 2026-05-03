-- Update employee data with realistic Tunisian names and information
-- IDs, passwords, and emails are NOT changed

-- ID 6: amine2 -> Zahra Ben Salah
UPDATE `employee` SET 
  first_name = 'Zahra',
  last_name = 'Ben Salah',
  address = 'Rue de la Liberté, Tunis',
  date_of_birth = '1992-06-15',
  phone_number = '+21698234567',
  gender = 'Female',
  job_title = 'Senior Developer',
  joining_date = '2022-03-10',
  marital_status = 'MARRIED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '12345678',
  emergency_contact = 'Ali Ben Salah',
  employee_code = 'EMP006'
WHERE id = 6;

-- ID 7: Manager Manager3 -> Khaled Bouaziz
UPDATE `employee` SET 
  first_name = 'Khaled',
  last_name = 'Bouaziz',
  address = 'Avenue Bourguiba, Sfax',
  date_of_birth = '1988-11-22',
  phone_number = '+21698345678',
  gender = 'Male',
  job_title = 'Department Manager',
  joining_date = '2020-01-15',
  marital_status = 'MARRIED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '87654321',
  emergency_contact = 'Nour Bouaziz',
  employee_code = 'MGR007'
WHERE id = 7;

-- ID 8: Manager Manager1 -> Sami Kharroubi
UPDATE `employee` SET 
  first_name = 'Sami',
  last_name = 'Kharroubi',
  address = 'Boulevard 7 Novembre, Sousse',
  date_of_birth = '1985-03-18',
  phone_number = '+21699456789',
  gender = 'Male',
  job_title = 'HR Manager',
  joining_date = '2019-06-01',
  marital_status = 'MARRIED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '23456789',
  emergency_contact = 'Leila Kharroubi',
  employee_code = 'MGR008'
WHERE id = 8;

-- ID 9: John Smith -> Hedi Romdhane
UPDATE `employee` SET 
  first_name = 'Hedi',
  last_name = 'Romdhane',
  address = 'Rue Ibn Khaldoun, Tunis',
  date_of_birth = '1995-07-20',
  phone_number = '+21698567890',
  gender = 'Male',
  job_title = 'Full Stack Developer',
  joining_date = '2023-02-20',
  marital_status = 'SINGLE',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '34567890',
  emergency_contact = 'Fatima Romdhane',
  employee_code = 'EMP009'
WHERE id = 9;

-- ID 11: Manager Manager2 -> Nouha Sayadi
UPDATE `employee` SET 
  first_name = 'Nouha',
  last_name = 'Sayadi',
  address = 'Place Pasteur, Tunis',
  date_of_birth = '1990-01-10',
  phone_number = '+21696234567',
  gender = 'Female',
  job_title = 'Operations Manager',
  joining_date = '2021-09-05',
  marital_status = 'MARRIED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '45678901',
  emergency_contact = 'Mohamed Sayadi',
  employee_code = 'MGR011'
WHERE id = 11;

-- ID 12: M G -> Tarek Guedhami
UPDATE `employee` SET 
  first_name = 'Tarek',
  last_name = 'Guedhami',
  address = 'Rue Taieb Mhiri, Kairouan',
  date_of_birth = '1993-05-12',
  phone_number = '+21697345678',
  gender = 'Male',
  job_title = 'Business Analyst',
  joining_date = '2023-01-10',
  marital_status = 'SINGLE',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '56789012',
  emergency_contact = 'Amira Guedhami',
  employee_code = 'EMP012'
WHERE id = 12;

-- ID 13: A G -> Amina Goubeia
UPDATE `employee` SET 
  first_name = 'Amina',
  last_name = 'Goubeia',
  address = 'Avenue de la Paix, Djerba',
  date_of_birth = '1987-09-25',
  phone_number = '+21695234567',
  gender = 'Female',
  job_title = 'Finance Director',
  joining_date = '2018-11-01',
  marital_status = 'DIVORCED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '67890123',
  emergency_contact = 'Hassan Goubeia',
  employee_code = 'MGR013'
WHERE id = 13;

-- ID 14: Michael Brown -> Youssef Turki
UPDATE `employee` SET 
  first_name = 'Youssef',
  last_name = 'Turki',
  address = 'Rue de la Victoire, Kasserine',
  date_of_birth = '1994-08-30',
  phone_number = '+21698901234',
  gender = 'Male',
  job_title = 'QA Engineer',
  joining_date = '2022-05-15',
  marital_status = 'SINGLE',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '78901234',
  emergency_contact = 'Saida Turki',
  employee_code = 'EMP014'
WHERE id = 14;

-- ID 15: Emily Davis -> Lamia Driss
UPDATE `employee` SET 
  first_name = 'Lamia',
  last_name = 'Driss',
  address = 'Boulevard El Amir, Gabès',
  date_of_birth = '1996-02-14',
  phone_number = '+21697012345',
  gender = 'Female',
  job_title = 'Junior Developer',
  joining_date = '2023-03-01',
  marital_status = 'SINGLE',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '89012345',
  emergency_contact = 'Karim Driss',
  employee_code = 'EMP015'
WHERE id = 15;

-- ID 16: David Wilson -> Adel Harbaoui
UPDATE `employee` SET 
  first_name = 'Adel',
  last_name = 'Harbaoui',
  address = 'Rue El Manara, Sousse',
  date_of_birth = '1989-12-03',
  phone_number = '+21696123456',
  gender = 'Male',
  job_title = 'System Administrator',
  joining_date = '2020-08-10',
  marital_status = 'MARRIED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '90123456',
  emergency_contact = 'Nadia Harbaoui',
  employee_code = 'EMP016'
WHERE id = 16;

-- ID 17: Jessica Taylor -> Souha Belkhir
UPDATE `employee` SET 
  first_name = 'Souha',
  last_name = 'Belkhir',
  address = 'Avenue El Habib, Sfax',
  date_of_birth = '1998-04-07',
  phone_number = '+21699234567',
  gender = 'Female',
  job_title = 'HR Specialist',
  joining_date = '2023-06-15',
  marital_status = 'SINGLE',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '01234567',
  emergency_contact = 'Moncef Belkhir',
  employee_code = 'EMP017'
WHERE id = 17;

-- ID 18: Robert Garcia -> Riadh Mahjoubi
UPDATE `employee` SET 
  first_name = 'Riadh',
  last_name = 'Mahjoubi',
  address = 'Rue de la Gare, Sfax',
  date_of_birth = '1991-10-19',
  phone_number = '+21698012345',
  gender = 'Male',
  job_title = 'Database Administrator',
  joining_date = '2021-04-20',
  marital_status = 'MARRIED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '12345678',
  emergency_contact = 'Zaineb Mahjoubi',
  employee_code = 'EMP018'
WHERE id = 18;

-- ID 19: Linda Martinez -> Leila Bouzidi
UPDATE `employee` SET 
  first_name = 'Leila',
  last_name = 'Bouzidi',
  address = 'Place de l\'Indépendance, Tunis',
  date_of_birth = '1993-11-28',
  phone_number = '+21697123456',
  gender = 'Female',
  job_title = 'Project Manager',
  joining_date = '2022-01-10',
  marital_status = 'MARRIED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '23456789',
  emergency_contact = 'Jamal Bouzidi',
  employee_code = 'EMP019'
WHERE id = 19;

-- ID 20: William Anderson -> Walid Ghaffar
UPDATE `employee` SET 
  first_name = 'Walid',
  last_name = 'Ghaffar',
  address = 'Rue de Marseille, Sousse',
  date_of_birth = '1986-06-05',
  phone_number = '+21695345678',
  gender = 'Male',
  job_title = 'Senior Analyst',
  joining_date = '2019-09-01',
  marital_status = 'MARRIED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '34567890',
  emergency_contact = 'Noor Ghaffar',
  employee_code = 'EMP020'
WHERE id = 20;

-- ID 21: Maria Hernandez -> Meriem Hadj
UPDATE `employee` SET 
  first_name = 'Meriem',
  last_name = 'Hadj',
  address = 'Rue du Peuple, Sfax',
  date_of_birth = '1994-03-16',
  phone_number = '+21696456789',
  gender = 'Female',
  job_title = 'Marketing Coordinator',
  joining_date = '2022-07-10',
  marital_status = 'SINGLE',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '45678901',
  emergency_contact = 'Karim Hadj',
  employee_code = 'EMP021'
WHERE id = 21;

-- ID 22: James Moore -> Jamal Meddeb
UPDATE `employee` SET 
  first_name = 'Jamal',
  last_name = 'Meddeb',
  address = 'Avenue des Colonies, Tunis',
  date_of_birth = '1990-09-22',
  phone_number = '+21698567890',
  gender = 'Male',
  job_title = 'Infrastructure Engineer',
  joining_date = '2021-02-15',
  marital_status = 'MARRIED',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '56789012',
  emergency_contact = 'Hana Meddeb',
  employee_code = 'EMP022'
WHERE id = 22;

-- ID 23: Barbara Jackson -> Bouchra Jemli
UPDATE `employee` SET 
  first_name = 'Bouchra',
  last_name = 'Jemli',
  address = 'Rue Ibn Sina, Kairouan',
  date_of_birth = '1997-07-08',
  phone_number = '+21699678901',
  gender = 'Female',
  job_title = 'Assistant Developer',
  joining_date = '2023-08-01',
  marital_status = 'SINGLE',
  nationality = 'Tunisian',
  situation = 'Permanent',
  cin = '67890123',
  emergency_contact = 'Ridha Jemli',
  employee_code = 'EMP023'
WHERE id = 23;
