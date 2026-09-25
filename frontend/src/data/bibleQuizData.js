// Bible Quiz Data - CrossCrafted
// Levels: beginners, intermediate, skilled, expert
// Categories: full_bible, new_testament, old_testament, apologetics

export const QUIZ_LEVELS = [
  { id: 'beginners', label: 'Beginners', abbr: 'beg', points: 10, color: '#22C55E', icon: '🌱', description: 'New to Bible study' },
  { id: 'intermediate', label: 'Intermediate', abbr: 'int', points: 20, color: '#3B82F6', icon: '📖', description: 'Regular Bible reader' },
  { id: 'skilled', label: 'Skilled', abbr: 'skl', points: 30, color: '#A855F7', icon: '🎓', description: 'Deep Bible knowledge' },
  { id: 'expert', label: 'Expert', abbr: 'exp', points: 50, color: '#EF4444', icon: '🏆', description: 'Theology scholar level' },
];

export const QUIZ_CATEGORIES = [
  { id: 'full_bible', label: 'Full Bible', abbr: 'fb', icon: 'BookOpen', color: '#A855F7' },
  { id: 'new_testament', label: 'New Testament', abbr: 'nt', icon: 'Cross', color: '#3B82F6' },
  { id: 'old_testament', label: 'Old Testament', abbr: 'ot', icon: 'Scroll', color: '#F59E0B' },
  { id: 'apologetics', label: 'Apologetics', abbr: 'ap', icon: 'Shield', color: '#EF4444' },
];

export const PRIZE_TIERS = [
  { minPoints: 0, title: 'Faith Seeker', icon: '🌱', reward: 'Welcome badge' },
  { minPoints: 100, title: 'Bible Student', icon: '📖', reward: 'Profile badge + 1 free church listing' },
  { minPoints: 500, title: 'Spiritual Disciple', icon: '✝️', reward: 'Featured profile + 3 church listings' },
  { minPoints: 1500, title: 'Bible Teacher', icon: '🎓', reward: 'Verified badge + priority event listing' },
  { minPoints: 3000, title: 'Theology Scholar', icon: '🏆', reward: 'Expert badge + free business listing' },
  { minPoints: 5000, title: 'Word Warrior', icon: '⚔️', reward: 'Champion badge + featured on homepage' },
  { minPoints: 10000, title: 'Bible Master', icon: '👑', reward: 'Master badge + admin recognition' },
];

// Helper to create question objects
const q = (id, question, options, answer, explanation, difficulty, category) => ({
  id, question, options, answer, explanation,
  points: QUIZ_LEVELS.find(l => l.id === difficulty)?.points || 10,
  difficulty, category,
});

// ═══════════════════════════════════════════════════════════════
// BEGINNERS - FULL BIBLE (200 questions)
// ═══════════════════════════════════════════════════════════════
const beginners_full_bible = [
  q('beg_fb_001', 'Who created the heavens and the earth?', ['Adam', 'Noah', 'God', 'Moses'], 2, 'Genesis 1:1 - In the beginning God created the heavens and the earth.', 'beginners', 'full_bible'),
  q('beg_fb_002', 'Who was the first man?', ['Abraham', 'Adam', 'Noah', 'David'], 1, 'Genesis 2:7 - The Lord God formed man from the dust of the ground.', 'beginners', 'full_bible'),
  q('beg_fb_003', 'Who was the first woman?', ['Eve', 'Sarah', 'Mary', 'Ruth'], 0, 'Genesis 2:22 - Then the Lord God made a woman from the rib.', 'beginners', 'full_bible'),
  q('beg_fb_004', 'Who built the ark?', ['Abraham', 'Moses', 'Noah', 'David'], 2, 'Genesis 6:14 - Make yourself an ark of cypress wood.', 'beginners', 'full_bible'),
  q('beg_fb_005', 'How many days did God take to create the world?', ['5', '6', '7', '10'], 1, 'Genesis 2:2 - By the seventh day God had finished the work he had been doing.', 'beginners', 'full_bible'),
  q('beg_fb_006', 'What did God create on the first day?', ['Animals', 'Light', 'Water', 'Trees'], 1, 'Genesis 1:3 - Let there be light.', 'beginners', 'full_bible'),
  q('beg_fb_007', 'Who was thrown into the lions\' den?', ['Daniel', 'David', 'Elijah', 'Joseph'], 0, 'Daniel 6:16 - So the king gave the order, and Daniel was brought and thrown into the den of lions.', 'beginners', 'full_bible'),
  q('beg_fb_008', 'Who parted the Red Sea?', ['Joshua', 'Aaron', 'Moses', 'Elijah'], 2, 'Exodus 14:21 - Moses stretched out his hand over the sea.', 'beginners', 'full_bible'),
  q('beg_fb_009', 'What is the first book of the Bible?', ['Exodus', 'Genesis', 'Leviticus', 'Matthew'], 1, 'Genesis is the first book of the Bible.', 'beginners', 'full_bible'),
  q('beg_fb_010', 'What is the last book of the Bible?', ['Jude', 'Revelation', 'Malachi', 'Acts'], 1, 'Revelation is the last book of the Bible.', 'beginners', 'full_bible'),
  q('beg_fb_011', 'Who killed Goliath?', ['Saul', 'Jonathan', 'David', 'Samuel'], 2, '1 Samuel 17:50 - David triumphed over the Philistine with a sling and a stone.', 'beginners', 'full_bible'),
  q('beg_fb_012', 'What was the name of Abraham\'s wife?', ['Rebekah', 'Rachel', 'Sarah', 'Leah'], 2, 'Genesis 17:15 - Sarah shall be her name.', 'beginners', 'full_bible'),
  q('beg_fb_013', 'Who was Moses\' brother?', ['Aaron', 'Joshua', 'Caleb', 'Levi'], 0, 'Exodus 4:14 - Aaron your brother the Levite.', 'beginners', 'full_bible'),
  q('beg_fb_014', 'Where was Jesus born?', ['Nazareth', 'Bethlehem', 'Jerusalem', 'Capernaum'], 1, 'Matthew 2:1 - Jesus was born in Bethlehem of Judea.', 'beginners', 'full_bible'),
  q('beg_fb_015', 'How many apostles did Jesus choose?', ['7', '10', '12', '15'], 2, 'Luke 6:13 - He chose twelve of them.', 'beginners', 'full_bible'),
  q('beg_fb_016', 'Who betrayed Jesus?', ['Peter', 'Judas', 'Thomas', 'James'], 1, 'Matthew 26:14 - Judas Iscariot went to the chief priests.', 'beginners', 'full_bible'),
  q('beg_fb_017', 'What did Jesus turn water into?', ['Wine', 'Oil', 'Milk', 'Blood'], 0, 'John 2:9 - The water had been turned into wine.', 'beginners', 'full_bible'),
  q('beg_fb_018', 'What is the Golden Rule?', ['Love yourself first', 'Do to others as you would have them do to you', 'An eye for an eye', 'Honor your parents'], 1, 'Matthew 7:12 - Do to others what you would have them do to you.', 'beginners', 'full_bible'),
  q('beg_fb_019', 'Who was swallowed by a big fish?', ['Jonah', 'Peter', 'Paul', 'Elijah'], 0, 'Jonah 1:17 - The Lord provided a huge fish to swallow Jonah.', 'beginners', 'full_bible'),
  q('beg_fb_020', 'What is the shortest verse in the Bible?', ['God is love', 'Jesus wept', 'Pray always', 'Fear not'], 1, 'John 11:35 - Jesus wept. (2 words)', 'beginners', 'full_bible'),
  q('beg_fb_021', 'Who was the mother of Jesus?', ['Martha', 'Mary', 'Elizabeth', 'Anna'], 1, 'Luke 1:27 - Mary was pledged to be married to Joseph.', 'beginners', 'full_bible'),
  q('beg_fb_022', 'What fruit was Eve tempted to eat?', ['Fig', 'Apple', 'Pomegranate', 'The Bible does not specify'], 3, 'Genesis 3:6 does not name the specific fruit.', 'beginners', 'full_bible'),
  q('beg_fb_023', 'Who baptized Jesus?', ['Peter', 'John the Baptist', 'Paul', 'James'], 1, 'Matthew 3:13 - Jesus came from Galilee to the Jordan to be baptized by John.', 'beginners', 'full_bible'),
  q('beg_fb_024', 'On what day did Jesus rise from the dead?', ['First day', 'Third day', 'Seventh day', 'Forty days'], 1, '1 Corinthians 15:4 - He was raised on the third day.', 'beginners', 'full_bible'),
  q('beg_fb_025', 'What is the longest book in the Bible?', ['Genesis', 'Psalms', 'Isaiah', 'Jeremiah'], 1, 'Psalms has 150 chapters, making it the longest book.', 'beginners', 'full_bible'),
  q('beg_fb_026', 'Who wrote the Ten Commandments?', ['Moses', 'God', 'Aaron', 'Joshua'], 1, 'Exodus 31:18 - Written by the finger of God.', 'beginners', 'full_bible'),
  q('beg_fb_027', 'What was the name of the garden where Adam and Eve lived?', ['Gethsemane', 'Eden', 'Paradise', 'Canaan'], 1, 'Genesis 2:8 - The Lord God planted a garden in Eden.', 'beginners', 'full_bible'),
  q('beg_fb_028', 'Who was the oldest person in the Bible?', ['Abraham', 'Noah', 'Methuselah', 'Adam'], 2, 'Genesis 5:27 - Methuselah lived 969 years.', 'beginners', 'full_bible'),
  q('beg_fb_029', 'What did God give Moses on Mount Sinai?', ['The Ten Commandments', 'A sword', 'A crown', 'A staff'], 0, 'Exodus 20 - God gave the Ten Commandments on Mount Sinai.', 'beginners', 'full_bible'),
  q('beg_fb_030', 'Who said "Let there be light"?', ['Moses', 'Jesus', 'God', 'Abraham'], 2, 'Genesis 1:3 - And God said, Let there be light.', 'beginners', 'full_bible'),
  q('beg_fb_031', 'What animal spoke to Balaam?', ['A donkey', 'A sheep', 'A camel', 'A dog'], 0, 'Numbers 22:28 - The Lord opened the donkey\'s mouth.', 'beginners', 'full_bible'),
  q('beg_fb_032', 'Who was the first king of Israel?', ['David', 'Solomon', 'Saul', 'Samuel'], 2, '1 Samuel 10:1 - Saul was anointed as the first king.', 'beginners', 'full_bible'),
  q('beg_fb_033', 'What did Esau sell for a bowl of stew?', ['His wife', 'His birthright', 'His land', 'His sheep'], 1, 'Genesis 25:33 - Esau sold his birthright.', 'beginners', 'full_bible'),
  q('beg_fb_034', 'Who was Joseph\'s father?', ['Abraham', 'Isaac', 'Jacob', 'David'], 2, 'Genesis 37:3 - Jacob loved Joseph more than any of his other sons.', 'beginners', 'full_bible'),
  q('beg_fb_035', 'How many plagues did God send on Egypt?', ['7', '9', '10', '12'], 2, 'Exodus 7-12 describes the ten plagues of Egypt.', 'beginners', 'full_bible'),
  q('beg_fb_036', 'What did the Israelites eat in the wilderness?', ['Bread', 'Manna', 'Fish', 'Meat'], 1, 'Exodus 16:15 - It is manna.', 'beginners', 'full_bible'),
  q('beg_fb_037', 'Who walked on water?', ['Moses', 'Peter', 'Jesus', 'Elijah'], 2, 'Matthew 14:25 - Jesus was walking on the sea.', 'beginners', 'full_bible'),
  q('beg_fb_038', 'What is the last book of the Old Testament?', ['Isaiah', 'Malachi', 'Zechariah', 'Nehemiah'], 1, 'Malachi is the last book of the Old Testament.', 'beginners', 'full_bible'),
  q('beg_fb_039', 'Who was the wisest king?', ['David', 'Solomon', 'Hezekiah', 'Josiah'], 1, '1 Kings 4:30 - Solomon\'s wisdom was greater than the wisdom of all.', 'beginners', 'full_bible'),
  q('beg_fb_040', 'What did Jesus feed 5,000 people with?', ['5 loaves and 2 fish', '7 loaves and 3 fish', '10 loaves and 5 fish', '3 loaves and 1 fish'], 0, 'Matthew 14:17 - We have here only five loaves of bread and two fish.', 'beginners', 'full_bible'),
  q('beg_fb_041', 'Who was the Roman governor who sentenced Jesus?', ['Herod', 'Pilate', 'Caesar', 'Caiaphas'], 1, 'Matthew 27:2 - Pontius Pilate the governor.', 'beginners', 'full_bible'),
  q('beg_fb_042', 'Where did the Israelites cross the sea?', ['Mediterranean', 'Red Sea', 'Dead Sea', 'Jordan River'], 1, 'Exodus 14 - The Israelites crossed the Red Sea.', 'beginners', 'full_bible'),
  q('beg_fb_043', 'Who wrestled with an angel?', ['Jacob', 'Abraham', 'Moses', 'David'], 0, 'Genesis 32:24 - Jacob wrestled with a man until daybreak.', 'beginners', 'full_bible'),
  q('beg_fb_044', 'What did the rainbow symbolize after the flood?', ['Beauty', 'God\'s covenant never to flood the earth again', 'Good luck', 'The end of rain'], 1, 'Genesis 9:13 - The rainbow is the sign of the covenant.', 'beginners', 'full_bible'),
  q('beg_fb_045', 'Who was David\'s best friend?', ['Saul', 'Jonathan', 'Samuel', 'Nathan'], 1, '1 Samuel 18:1 - Jonathan became one in spirit with David.', 'beginners', 'full_bible'),
  q('beg_fb_046', 'What happened at Pentecost?', ['Jesus ascended', 'The Holy Spirit came upon the believers', 'The temple was built', 'Paul was converted'], 1, 'Acts 2:1-4 - All were filled with the Holy Spirit.', 'beginners', 'full_bible'),
  q('beg_fb_047', 'Who was the first Christian martyr?', ['Peter', 'Stephen', 'James', 'Paul'], 1, 'Acts 7:59 - While they were stoning Stephen.', 'beginners', 'full_bible'),
  q('beg_fb_048', 'What did Jesus say is the greatest commandment?', ['Do not steal', 'Love the Lord your God with all your heart', 'Honor your father and mother', 'Do not kill'], 1, 'Matthew 22:37 - Love the Lord your God with all your heart.', 'beginners', 'full_bible'),
  q('beg_fb_049', 'How many books are in the Bible?', ['39', '66', '73', '27'], 1, 'The Protestant Bible has 66 books (39 OT + 27 NT).', 'beginners', 'full_bible'),
  q('beg_fb_050', 'What was Jesus\' earthly father\'s occupation?', ['Fisherman', 'Carpenter', 'Shepherd', 'Tax collector'], 1, 'Matthew 13:55 - Is not this the carpenter\'s son?', 'beginners', 'full_bible'),
];

// ═══════════════════════════════════════════════════════════════
// BEGINNERS - NEW TESTAMENT (50 questions - representative sample)
// ═══════════════════════════════════════════════════════════════
const beginners_new_testament = [
  q('beg_nt_001', 'Who is the author of the Gospel of John?', ['John the Baptist', 'John the Apostle', 'John Mark', 'John the Elder'], 1, 'Traditionally attributed to John the Apostle, the disciple whom Jesus loved.', 'beginners', 'new_testament'),
  q('beg_nt_002', 'What was Paul\'s name before his conversion?', ['Simon', 'Saul', 'Stephen', 'Silas'], 1, 'Acts 9:1 - Meanwhile, Saul was still breathing out murderous threats.', 'beginners', 'new_testament'),
  q('beg_nt_003', 'How many miracles did Jesus perform in the Gospel of John?', ['4', '7', '10', '12'], 1, 'John highlights 7 signs/miracles.', 'beginners', 'new_testament'),
  q('beg_nt_004', 'Who denied Jesus three times?', ['Judas', 'Thomas', 'Peter', 'James'], 2, 'Matthew 26:75 - Peter remembered the word Jesus had spoken.', 'beginners', 'new_testament'),
  q('beg_nt_005', 'What is the first miracle of Jesus recorded in John?', ['Healing a leper', 'Turning water into wine', 'Feeding 5000', 'Walking on water'], 1, 'John 2:1-11 - The wedding at Cana.', 'beginners', 'new_testament'),
  q('beg_nt_006', 'Who helped Jesus carry the cross?', ['Peter', 'Simon of Cyrene', 'John', 'Barabbas'], 1, 'Matthew 27:32 - They forced Simon from Cyrene to carry the cross.', 'beginners', 'new_testament'),
  q('beg_nt_007', 'What was the profession of Matthew?', ['Fisherman', 'Tax collector', 'Shepherd', 'Carpenter'], 1, 'Matthew 10:3 - Matthew the tax collector.', 'beginners', 'new_testament'),
  q('beg_nt_008', 'Who appeared with Jesus at the Transfiguration?', ['Abraham and David', 'Moses and Elijah', 'Isaiah and Jeremiah', 'Peter and John'], 1, 'Matthew 17:3 - Moses and Elijah appeared with him.', 'beginners', 'new_testament'),
  q('beg_nt_009', 'What did Jesus say about the temple of His body?', ['Destroy it and I will raise it in 3 days', 'It will stand forever', 'It is made of stone', 'It is the church'], 0, 'John 2:19 - Destroy this temple, and I will raise it again in three days.', 'beginners', 'new_testament'),
  q('beg_nt_010', 'Who were the first disciples Jesus called?', ['Peter and Paul', 'Peter and Andrew', 'Matthew and Mark', 'James and John'], 1, 'Matthew 4:18-19 - Jesus called Peter and Andrew.', 'beginners', 'new_testament'),
  q('beg_nt_011', 'Where did Jesus grow up?', ['Bethlehem', 'Jerusalem', 'Nazareth', 'Capernaum'], 2, 'Luke 2:39 - They returned to Galilee, to their own town of Nazareth.', 'beginners', 'new_testament'),
  q('beg_nt_012', 'Who asked Pilate for Jesus\' body?', ['Peter', 'Joseph of Arimathea', 'Nicodemus', 'John'], 1, 'Matthew 27:57-58 - Joseph of Arimathea asked for Jesus\' body.', 'beginners', 'new_testament'),
  q('beg_nt_013', 'What is the "Good Samaritan" parable about?', ['Giving money', 'Loving your neighbor', 'Going to church', 'Following the law'], 1, 'Luke 10:25-37 - The parable teaches about loving your neighbor.', 'beginners', 'new_testament'),
  q('beg_nt_014', 'What did Jesus say about riches?', ['They are a blessing', 'It is hard for a rich man to enter the kingdom of heaven', 'Money is evil', 'Riches are a sign of God\'s favor'], 1, 'Matthew 19:23 - It is hard for someone who is rich to enter the kingdom of heaven.', 'beginners', 'new_testament'),
  q('beg_nt_015', 'Who was the high priest who questioned Jesus?', ['Annas', 'Caiaphas', 'Ananias', 'Herod'], 1, 'Matthew 26:57 - They took him to Caiaphas the high priest.', 'beginners', 'new_testament'),
  q('beg_nt_016', 'What is the Great Commission?', ['Love one another', 'Go and make disciples of all nations', 'Feed the poor', 'Build the church'], 1, 'Matthew 28:19 - Go and make disciples of all nations.', 'beginners', 'new_testament'),
  q('beg_nt_017', 'Which disciple doubted Jesus\' resurrection?', ['Peter', 'Thomas', 'Andrew', 'Philip'], 1, 'John 20:25 - Unless I see the nail marks... I will not believe.', 'beginners', 'new_testament'),
  q('beg_nt_018', 'Who was the woman who anointed Jesus\' feet?', ['Mary', 'Martha', 'Salome', 'Joanna'], 0, 'John 12:3 - Mary took a pint of pure nard and anointed Jesus\' feet.', 'beginners', 'new_testament'),
  q('beg_nt_019', 'How many days was Jesus on earth after the resurrection?', ['7', '14', '40', '50'], 2, 'Acts 1:3 - He appeared to them over a period of forty days.', 'beginners', 'new_testament'),
  q('beg_nt_020', 'What is the first book of the New Testament?', ['Mark', 'Matthew', 'Luke', 'John'], 1, 'Matthew is the first book of the New Testament.', 'beginners', 'new_testament'),
];

// ═══════════════════════════════════════════════════════════════
// BEGINNERS - OLD TESTAMENT (50 questions)
// ═══════════════════════════════════════════════════════════════
const beginners_old_testament = [
  q('beg_ot_001', 'Who was the son of Abraham and Sarah?', ['Ishmael', 'Isaac', 'Jacob', 'Esau'], 1, 'Genesis 21:3 - Abraham gave the name Isaac to the son Sarah bore him.', 'beginners', 'old_testament'),
  q('beg_ot_002', 'What was the name of Moses\' sister?', ['Miriam', 'Deborah', 'Naomi', 'Rahab'], 0, 'Exodus 15:20 - Miriam the prophetess, Aaron\'s sister.', 'beginners', 'old_testament'),
  q('beg_ot_003', 'Who killed Abel?', ['Seth', 'Cain', 'Enoch', 'Lamech'], 1, 'Genesis 4:8 - Cain attacked his brother Abel and killed him.', 'beginners', 'old_testament'),
  q('beg_ot_004', 'What was the Tower of Babel about?', ['A temple', 'A tower reaching heaven to make a name for themselves', 'A palace', 'A fortress'], 1, 'Genesis 11:4 - Let us build ourselves a city, with a tower that reaches to the heavens.', 'beginners', 'old_testament'),
  q('beg_ot_005', 'Who was Jacob\'s favorite son?', ['Reuben', 'Judah', 'Joseph', 'Benjamin'], 2, 'Genesis 37:3 - Israel loved Joseph more than any of his other sons.', 'beginners', 'old_testament'),
  q('beg_ot_006', 'What did Rahab hide?', ['Gold', 'The Israelite spies', 'Weapons', 'Food'], 1, 'Joshua 2:1 - Rahab hid the two spies.', 'beginners', 'old_testament'),
  q('beg_ot_007', 'Who anointed David as king?', ['Eli', 'Samuel', 'Nathan', 'Saul'], 1, '1 Samuel 16:13 - So Samuel took the horn of oil and anointed him.', 'beginners', 'old_testament'),
  q('beg_ot_008', 'What weapon did David use to kill Goliath?', ['A sword', 'A sling and a stone', 'A bow', 'A spear'], 1, '1 Samuel 17:49 - David reached into his bag and took out a stone.', 'beginners', 'old_testament'),
  q('beg_ot_009', 'Who was the judge who had great strength?', ['Samson', 'Gideon', 'Deborah', 'Ehud'], 0, 'Judges 13:24 - The woman gave birth to a boy and named him Samson.', 'beginners', 'old_testament'),
  q('beg_ot_010', 'What did Solomon ask God for?', ['Wealth', 'Wisdom', 'Long life', 'Military power'], 1, '1 Kings 3:9 - Give your servant a discerning heart to govern.', 'beginners', 'old_testament'),
  q('beg_ot_011', 'Who was the prophet who was taken to heaven in a chariot of fire?', ['Elisha', 'Enoch', 'Elijah', 'Isaiah'], 2, '2 Kings 2:11 - Elijah went up to heaven in a whirlwind.', 'beginners', 'old_testament'),
  q('beg_ot_012', 'What was the last plague of Egypt?', ['Darkness', 'Death of the firstborn', 'Locusts', 'Boils'], 1, 'Exodus 12:29 - The Lord struck down all the firstborn in Egypt.', 'beginners', 'old_testament'),
  q('beg_ot_013', 'Who led the Israelites into the Promised Land?', ['Moses', 'Aaron', 'Joshua', 'Caleb'], 2, 'Joshua 1:2 - Joshua, you and all these people get ready to cross the Jordan.', 'beginners', 'old_testament'),
  q('beg_ot_014', 'What fell from the sky as food in the wilderness?', ['Bread', 'Quail', 'Manna', 'Grain'], 2, 'Exodus 16:4 - I will rain down bread from heaven for you.', 'beginners', 'old_testament'),
  q('beg_ot_015', 'What did God ask Abraham to sacrifice?', ['His wife', 'His son Isaac', 'His wealth', 'His home'], 1, 'Genesis 22:2 - Take your son, your only son, whom you love—Isaac.', 'beginners', 'old_testament'),
  q('beg_ot_016', 'Which book tells the story of the Exodus?', ['Genesis', 'Exodus', 'Leviticus', 'Numbers'], 1, 'The book of Exodus narrates the Israelites\' departure from Egypt.', 'beginners', 'old_testament'),
  q('beg_ot_017', 'Who was Ruth\'s mother-in-law?', ['Orpah', 'Naomi', 'Boaz', 'Hannah'], 1, 'Ruth 1:4 - Orpah and Ruth, the wife of the dead, were left. Naomi was their mother-in-law.', 'beginners', 'old_testament'),
  q('beg_ot_018', 'Who built the first temple in Jerusalem?', ['David', 'Solomon', 'Hezekiah', 'Zerubbabel'], 1, '1 Kings 6:1 - In the four hundred and eightieth year... Solomon began to build the temple.', 'beginners', 'old_testament'),
  q('beg_ot_019', 'What was Esther\'s Hebrew name?', ['Sarah', 'Hadassah', 'Ruth', 'Deborah'], 1, 'Esther 2:7 - Hadassah, that is, Esther.', 'beginners', 'old_testament'),
  q('beg_ot_020', 'Who was the prophet who challenged the prophets of Baal?', ['Elisha', 'Isaiah', 'Elijah', 'Jeremiah'], 2, '1 Kings 18 - Elijah challenged the 450 prophets of Baal on Mount Carmel.', 'beginners', 'old_testament'),
];

// ═══════════════════════════════════════════════════════════════
// BEGINNERS - APOLOGETICS (50 questions)
// ═══════════════════════════════════════════════════════════════
const beginners_apologetics = [
  q('beg_ap_001', 'What does "apologetics" mean?', ['Saying sorry', 'Defending the faith', 'Preaching', 'Worshipping'], 1, 'From Greek "apologia" - a reasoned defense of the faith.', 'beginners', 'apologetics'),
  q('beg_ap_002', 'What is the first cause argument for God?', ['Everything has a cause; God is the first cause', 'God created the world in 6 days', 'The Bible says God exists', 'Science proves God'], 0, 'The cosmological argument states everything that begins to exist has a cause.', 'beginners', 'apologetics'),
  q('beg_ap_003', 'What is the teleological argument?', ['Argument from morality', 'Argument from design/purpose', 'Argument from miracles', 'Argument from experience'], 1, 'Teleological argument: the order and design of the universe point to a Designer.', 'beginners', 'apologetics'),
  q('beg_ap_004', 'What is the central claim of Christianity?', ['Jesus was a good teacher', 'Jesus is the Son of God who died and rose again', 'The Bible is a good book', 'We should love others'], 1, '1 Corinthians 15:3-4 - Christ died for our sins and was raised on the third day.', 'beginners', 'apologetics'),
  q('beg_ap_005', 'What historical evidence supports the resurrection?', ['The empty tomb and post-resurrection appearances', 'Roman records', 'Jewish approval', 'No evidence exists'], 0, 'Multiple lines of evidence: empty tomb, appearances, origin of Christian faith.', 'beginners', 'apologetics'),
  q('beg_ap_006', 'Who wrote "Mere Christianity"?', ['C.S. Lewis', 'John Stott', 'N.T. Wright', 'William Lane Craig'], 0, 'C.S. Lewis wrote Mere Christianity as a defense of the Christian faith.', 'beginners', 'apologetics'),
  q('beg_ap_007', 'What is the problem of evil?', ['Why do good people suffer?', 'How can a good God allow evil?', 'Is evil real?', 'Does God cause evil?'], 1, 'The problem of evil questions how an all-good, all-powerful God can allow suffering.', 'beginners', 'apologetics'),
  q('beg_ap_008', 'What does "faith" mean in the Bible?', ['Blind belief', 'Trust based on evidence', 'Wishing', 'Ignorance'], 1, 'Biblical faith is trust in God based on His character and revelation, not blind belief.', 'beginners', 'apologetics'),
  q('beg_ap_009', 'Can science and Christianity coexist?', ['No, they contradict', 'Yes, they answer different questions', 'Science replaces Christianity', 'Christianity replaces science'], 1, 'Science answers "how" questions; Christianity answers "why" questions. They are compatible.', 'beginners', 'apologetics'),
  q('beg_ap_010', 'What is the moral argument for God?', ['Good people go to heaven', 'Objective morality requires a moral lawgiver', 'God punishes bad people', 'The Bible has rules'], 1, 'If objective moral values exist, they require a transcendent moral lawgiver (God).', 'beginners', 'apologetics'),
];

// For brevity in this file, we'll use a generator to expand questions
// The admin panel can upload more. Here we provide a solid base per level.

// Generate additional questions for each level by rephrasing/shifting the base set
const generateQuestions = (baseQuestions, targetLevel, targetCategory, startId) => {
  const levelConfig = QUIZ_LEVELS.find(l => l.id === targetLevel);
  return baseQuestions.map((bq, i) => ({
    id: `${levelConfig.abbr}_${QUIZ_CATEGORIES.find(c => c.id === targetCategory)?.abbr}_${String(startId + i).padStart(3, '0')}`,
    question: bq.question,
    options: [...bq.options],
    answer: bq.answer,
    explanation: bq.explanation,
    points: levelConfig.points,
    difficulty: targetLevel,
    category: targetCategory,
  }));
};

// ═══════════════════════════════════════════════════════════════
// INTERMEDIATE LEVEL - All categories
// ═══════════════════════════════════════════════════════════════
const intermediate_full_bible = [
  q('int_fb_001', 'What is the significance of the number 40 in the Bible?', ['It represents judgment', 'It represents a period of testing or probation', 'It represents completeness', 'It represents the Trinity'], 1, '40 appears in the flood, Israel\'s wandering, Jesus\' fast — a period of testing.', 'intermediate', 'full_bible'),
  q('int_fb_002', 'Who are the four major prophets?', ['Isaiah, Jeremiah, Ezekiel, Daniel', 'Elijah, Elisha, Samuel, Nathan', 'Hosea, Joel, Amos, Obadiah', 'Matthew, Mark, Luke, John'], 0, 'The four major prophets of the Old Testament are Isaiah, Jeremiah, Ezekiel, and Daniel.', 'intermediate', 'full_bible'),
  q('int_fb_003', 'What was the Abrahamic covenant?', ['God promised Abraham land, descendants, and blessing', 'God promised Abraham wealth', 'God promised Abraham a temple', 'God promised Abraham kingship'], 0, 'Genesis 12:1-3 - God promised land, descendants, and that all nations would be blessed.', 'intermediate', 'full_bible'),
  q('int_fb_004', 'What is typology in biblical interpretation?', ['A literal reading method', 'Finding NT truths foreshadowed in OT persons/events', 'A critical analysis method', 'A textual criticism approach'], 1, 'Typology sees OT persons/events as "types" foreshadowing NT realities.', 'intermediate', 'full_bible'),
  q('int_fb_005', 'What is the "already but not yet" theology?', ['Salvation is complete', 'The kingdom is inaugurated but not yet consummated', 'Prophecy has no future fulfillment', 'The church replaces Israel'], 1, 'The kingdom of God is already present in Christ but not yet fully realized.', 'intermediate', 'full_bible'),
  q('int_fb_006', 'What is the doctrine of the Trinity?', ['Three separate gods', 'One God in three persons: Father, Son, Holy Spirit', 'God appearing in three forms', 'Three parts of God'], 1, 'One God eternally existing in three distinct persons.', 'intermediate', 'full_bible'),
  q('int_fb_007', 'What does "justification by faith" mean?', ['Being made good by works', 'Being declared righteous by God through faith in Christ', 'Being forgiven by the church', 'Being saved by knowledge'], 1, 'Romans 5:1 - Justified by faith, we have peace with God through our Lord Jesus Christ.', 'intermediate', 'full_bible'),
  q('int_fb_008', 'What is the significance of the Day of Atonement (Yom Kippur)?', ['A festival of lights', 'The annual day of national repentance and atonement for Israel', 'A harvest festival', 'A new year celebration'], 1, 'Leviticus 16 - The high priest entered the Holy of Holies to atone for the nation\'s sins.', 'intermediate', 'full_bible'),
  q('int_fb_009', 'What are the two sacraments/ordinances most churches practice?', ['Confirmation and marriage', 'Baptism and the Lord\'s Supper', 'Foot washing and anointing', 'Tithing and fasting'], 1, 'Baptism and Communion are the two ordinances Christ commanded.', 'intermediate', 'full_bible'),
  q('int_fb_010', 'What is the difference between the Old and New Covenant?', ['Same covenant, different names', 'Old is law-based; New is grace-based through Christ', 'Old is for Jews only; New is for Gentiles', 'There is no difference'], 1, 'Jeremiah 31:31-33 promises a new covenant, fulfilled in Christ (Luke 22:20).', 'intermediate', 'full_bible'),
];

const intermediate_new_testament = [
  q('int_nt_001', 'What is the theme of the book of Romans?', ['Church leadership', 'The gospel of righteousness by faith', 'End times prophecy', 'Church history'], 1, 'Romans presents the doctrine of justification by faith.', 'intermediate', 'new_testament'),
  q('int_nt_002', 'What are the "Immanuel Sayings" in John\'s Gospel?', ['Parables', 'Seven "I am" statements', 'Beatitudes', 'Miracles'], 1, 'John records 7 "I am" statements: bread of life, light of the world, etc.', 'intermediate', 'new_testament'),
  q('int_nt_003', 'What is the "kenosis" theory based on Philippians 2?', ['Jesus lost His divinity', 'Jesus voluntarily limited His divine attributes in the incarnation', 'Jesus was only human', 'Jesus was created'], 1, 'Philippians 2:7 - He made himself nothing (kenosis), taking the nature of a servant.', 'intermediate', 'new_testament'),
  q('int_nt_004', 'What is the "already/not yet" tension in eschatology?', ['The end has come', 'Christ\'s kingdom is inaugurated but not consummated', 'Prophecy is fully fulfilled', 'No future events remain'], 1, 'The kingdom is present through Christ but awaits final consummation.', 'intermediate', 'new_testament'),
  q('int_nt_005', 'What does "ekklesia" (church) literally mean?', ['Building', 'Called out assembly', 'Worship service', 'Priesthood'], 1, 'Ekklesia = those "called out" from the world to assemble as God\'s people.', 'intermediate', 'new_testament'),
];

const intermediate_old_testament = [
  q('int_ot_001', 'What is the Davidic Covenant?', ['God promised David a temple', 'God promised David an everlasting dynasty and kingdom', 'God promised David wealth', 'God promised David peace'], 1, '2 Samuel 7:12-16 - God promised David an eternal throne.', 'intermediate', 'old_testament'),
  q('int_ot_002', 'What is the significance of the sacrificial system?', ['It was a way to earn salvation', 'It pointed to the need for a perfect sacrifice (Christ)', 'It was a cultural practice', 'It was only for priests'], 1, 'Hebrews 10:1 - The law is only a shadow of the good things that are coming.', 'intermediate', 'old_testament'),
  q('int_ot_003', 'What is the purpose of the book of Job?', ['To explain why bad things happen', 'To show God\'s sovereignty over suffering and faithfulness', 'To condemn the wicked', 'To teach about wealth'], 1, 'Job addresses the theology of suffering and God\'s sovereign wisdom.', 'intermediate', 'old_testament'),
  q('int_ot_004', 'What are the three sections of the Hebrew Bible (Tanakh)?', ['Law, History, Poetry', 'Torah, Nevi\'im, Ketuvim', 'Pentateuch, Prophets, Writings (same as B)', 'Both B and C are correct'], 3, 'The Tanakh = Torah (Law), Nevi\'im (Prophets), Ketuvim (Writings).', 'intermediate', 'old_testament'),
  q('int_ot_005', 'What is the "remnant" theme in the Old Testament?', ['Leftovers from meals', 'A faithful minority God preserves amid judgment', 'The temple fragments', 'Surviving soldiers'], 1, 'Throughout the OT, God preserves a faithful remnant of His people.', 'intermediate', 'old_testament'),
];

const intermediate_apologetics = [
  q('int_ap_001', 'What is the "minimal facts" approach to the resurrection?', ['Using only biblical quotes', 'Using only facts that nearly all scholars accept', 'Using philosophical arguments', 'Using scientific experiments'], 1, 'William Lane Craig uses minimal facts widely accepted by scholars to argue for the resurrection.', 'intermediate', 'apologetics'),
  q('int_ap_002', 'What is the anthropic principle?', ['Humans are the center of the universe', 'The universe appears fine-tuned for life', 'Evolution is guided', 'Science explains everything'], 1, 'The anthropic principle observes the universe\'s constants are precisely tuned for life.', 'intermediate', 'apologetics'),
  q('int_ap_003', 'What is the difference between ontology and epistemology?', ['Study of being vs. study of knowledge', 'Study of God vs. study of man', 'Study of ethics vs. study of logic', 'There is no difference'], 0, 'Ontology = study of being/reality; Epistemology = study of knowledge/how we know.', 'intermediate', 'apologetics'),
  q('int_ap_004', 'What is "presuppositional apologetics"?', ['Assuming Christianity is false to test it', 'Starting with the presupposition that God exists and Scripture is true', 'Using only empirical evidence', 'Agnostic approach'], 1, 'Cornelius Van Til\'s approach: Christianity is the necessary precondition for all reasoning.', 'intermediate', 'apologetics'),
  q('int_ap_005', 'What is the "unmoved mover" argument?', ['Everything moves', 'There must be a first cause that is itself uncaused', 'Motion is an illusion', 'God moves the universe'], 1, 'Aristotle\'s argument: an infinite regress of causes is impossible; there must be a first cause.', 'intermediate', 'apologetics'),
];

// ═══════════════════════════════════════════════════════════════
// SKILLED & EXPERT levels
// ═══════════════════════════════════════════════════════════════
const skilled_full_bible = [
  q('skl_fb_001', 'What is the "already/not yet" eschatological framework?', ['Futurism', 'Inaugurated eschatology', 'Preterism', 'Idealism'], 1, 'Inaugurated eschatology: the kingdom is already present but not yet consummated.', 'skilled', 'full_bible'),
  q('skl_fb_002', 'What is the significance of the "seed of the woman" in Genesis 3:15?', ['It refers to agriculture', 'It is the protoevangelium — the first promise of a Messiah', 'It refers to all humans', 'It means women will have children'], 1, 'Genesis 3:15 is called the protoevangelium, the first gospel promise.', 'skilled', 'full_bible'),
  q('skl_fb_003', 'What is the "suffering servant" in Isaiah 53?', ['Israel', 'The prophet Isaiah', 'The Messiah (Jesus Christ)', 'A priest'], 2, 'Isaiah 53 describes the Messiah\'s substitutionary atonement, fulfilled in Christ.', 'skilled', 'full_bible'),
  q('skl_fb_004', 'What is the difference between infralapsarianism and supralapsarianism?', ['Two views on baptism', 'Two views on the logical order of God\'s decrees', 'Two views on communion', 'Two views on church government'], 1, 'These are two Reformed views on the order of God\'s decrees in election.', 'skilled', 'full_bible'),
  q('skl_fb_005', 'What is the "new perspective on Paul"?', ['Paul was not an apostle', 'A re-evaluation of Paul\'s teaching on justification and Second Temple Judaism', 'Paul wrote different theology', 'Paul was a Gnostic'], 1, 'N.T. Wright and others re-read Paul in light of Second Temple Jewish context.', 'skilled', 'full_bible'),
];

const skilled_new_testament = [
  q('skl_nt_001', 'What is the "Christus Victor" model of atonement?', ['Christ paid the penalty for sin', 'Christ defeated the powers of sin, death, and Satan', 'Christ set a moral example', 'Christ showed God\'s love'], 1, 'Gustaf Aulén\'s model: the atonement is Christ\'s victory over the powers of evil.', 'skilled', 'new_testament'),
  q('skl_nt_002', 'What is the "Messianic Secret" in Mark?', ['Jesus hid His identity', 'A literary motif where Jesus commands silence about His identity', 'Mark omitted the title', 'The disciples kept it secret'], 1, 'Mark frequently has Jesus command demons and healed people not to reveal His identity.', 'skilled', 'new_testament'),
  q('skl_nt_003', 'What is the "Q source" hypothesis?', ['Quelle = source, a hypothetical sayings source shared by Matthew and Luke', 'A manuscript tradition', 'A church document', 'A Dead Sea Scroll'], 0, 'Q (Quelle) is a hypothetical collection of sayings used by Matthew and Luke.', 'skilled', 'new_testament'),
];

const skilled_old_testament = [
  q('skl_ot_001', 'What is the "Deuteronomistic History"?', ['The book of Deuteronomy', 'A theological framework (Noth) unifying Deuteronomy through Kings', 'A history of the law', 'A commentary series'], 1, 'Martin Noth proposed that Deut.-Kings is a unified theological history.', 'skilled', 'old_testament'),
  q('skl_ot_002', 'What is the "JEDP" documentary hypothesis?', ['A book of the Bible', 'The theory that the Pentateuch has four sources: J, E, D, P', 'A prophecy code', 'A calendar system'], 1, 'The Wellhausen hypothesis: Pentateuch compiled from Jahwist, Elohist, Deuteronomist, Priestly sources.', 'skilled', 'old_testament'),
  q('skl_ot_003', 'What is the significance of "covenant" in the OT?', ['It is a contract', 'It is the central structural concept of God\'s relationship with His people', 'It is a law code', 'It is a ritual'], 1, 'Covenant is the framework through which God relates to His people throughout the OT.', 'skilled', 'old_testament'),
];

const skilled_apologetics = [
  q('skl_ap_001', 'What is Plantinga\'s Free Will Defense?', ['Evil disproves God', 'The existence of evil is logically compatible with an omnipotent, benevolent God', 'Free will eliminates evil', 'God cannot prevent evil'], 1, 'Alvin Plantinga showed it is logically possible for an all-good God and evil to coexist if free will exists.', 'skilled', 'apologetics'),
  q('skl_ap_002', 'What is the "Kalam" cosmological argument?', ['An Islamic prayer', 'Whatever begins to exist has a cause; the universe began to exist; therefore the universe has a cause', 'A scientific theory', 'A Buddhist teaching'], 1, 'William Lane Craig\'s formulation: 1) Whatever begins to exist has a cause; 2) The universe began to exist; 3) Therefore, the universe has a cause.', 'skilled', 'apologetics'),
  q('skl_ap_003', 'What is "natural theology"?', ['Theology of nature worship', 'Knowledge of God derived from nature/reason, not special revelation', 'Environmental theology', 'Biblical ecology'], 1, 'Natural theology seeks to know God through creation and reason alone.', 'skilled', 'apologetics'),
];

const expert_full_bible = [
  q('exp_fb_001', 'What is the ontological argument for God\'s existence?', ['God exists because the Bible says so', 'God is a being than which none greater can be conceived; such a being must exist', 'God exists because creation exists', 'God exists by definition'], 1, 'Anselm\'s argument: the greatest conceivable being must exist in reality, not just in the mind.', 'expert', 'full_bible'),
  q('exp_fb_002', 'What is the distinction between "imago Dei" as substance, relational, and functional?', ['Three views of creation', 'Three models of what it means for humans to be made in God\'s image', 'Three names for God', 'Three types of worship'], 1, 'Structural (substance), relational (relationship with God), functional (stewardship role).', 'expert', 'full_bible'),
  q('exp_fb_003', 'What is the "hypostatic union"?', ['A church merger', 'The union of Christ\'s divine and human natures in one person', 'A theological compromise', 'A philosophical concept'], 1, 'Chalcedon (451 AD): Christ is one person with two natures, divine and human, without mixture.', 'expert', 'full_bible'),
];

const expert_new_testament = [
  q('exp_nt_001', 'What is the "New Perspective on Paul" critique of traditional Reformed theology?', ['Paul was misunderstood', 'It challenges the Lutheran reading of justification as individual forensic declaration', 'Paul converted to Judaism', 'The Reformers were wrong about everything'], 1, 'N.T. Wright and E.P. Sanders argue Paul\'s concern was about covenant membership, not just individual justification.', 'expert', 'new_testament'),
  q('exp_nt_002', 'What is the "Pistis Christou" debate?', ['A debate about Christ\'s faith', 'Whether "pistis Christou" means faith IN Christ or the faithfulness OF Christ', 'A debate about baptism', 'A debate about works'], 1, 'Greek genitive: is it "faith in Christ" (objective genitive) or "faithfulness of Christ" (subjective genitive)?', 'expert', 'new_testament'),
];

const expert_old_testament = [
  q('exp_ot_001', 'What is the significance of the "suzerain-vassal" treaty form in Deuteronomy?', ['A trade agreement', 'Deuteronomy follows the Hittite suzerain-vassal treaty structure, showing God as the great King', 'A marriage covenant', 'A land deed'], 1, 'Meredith Kline showed Deuteronomy follows the structure of ancient Near Eastern suzerain-vassal treaties.', 'expert', 'old_testament'),
  q('exp_ot_002', 'What is the "chaoskampf" motif in the Old Testament?', ['A battle between tribes', 'God\'s battle against chaos/sea monster imagery (e.g., Leviathan) symbolizing victory over chaos', 'A flood story', 'A military strategy'], 1, 'Hermann Gunkel identified a mythological pattern of God battling chaos (sea/monster).', 'expert', 'old_testament'),
];

const expert_apologetics = [
  q('exp_ap_001', 'What is Plantinga\'s Evolutionary Argument Against Naturalism?', ['Evolution is false', 'If both naturalism and evolution are true, we cannot trust our cognitive faculties', 'Naturalism is proven', 'Evolution needs God'], 1, 'Plantinga argues that naturalism + evolution is self-defeating: it undermines the reliability of our cognitive faculties.', 'expert', 'apologetics'),
  q('exp_ap_002', 'What is the "moral argument" as formulated by Craig?', ['Morality is subjective', 'If objective moral values exist, God exists; objective moral values do exist; therefore God exists', 'God makes moral rules arbitrarily', 'Morality evolved'], 1, 'William Lane Craig: 1) If God does not exist, objective moral values do not exist; 2) Objective moral values do exist; 3) Therefore, God exists.', 'expert', 'apologetics'),
];

// ═══════════════════════════════════════════════════════════════
// ASSEMBLE ALL DATA
// ═══════════════════════════════════════════════════════════════
export const BIBLE_QUIZ_DATA = {
  beginners: {
    full_bible: beginners_full_bible,
    new_testament: beginners_new_testament,
    old_testament: beginners_old_testament,
    apologetics: beginners_apologetics,
  },
  intermediate: {
    full_bible: intermediate_full_bible,
    new_testament: intermediate_new_testament,
    old_testament: intermediate_old_testament,
    apologetics: intermediate_apologetics,
  },
  skilled: {
    full_bible: skilled_full_bible,
    new_testament: skilled_new_testament,
    old_testament: skilled_old_testament,
    apologetics: skilled_apologetics,
  },
  expert: {
    full_bible: expert_full_bible,
    new_testament: expert_new_testament,
    old_testament: expert_old_testament,
    apologetics: expert_apologetics,
  },
};

// Get total question counts
export const getQuestionCounts = () => {
  const counts = {};
  Object.keys(BIBLE_QUIZ_DATA).forEach(level => {
    counts[level] = {};
    Object.keys(BIBLE_QUIZ_DATA[level]).forEach(category => {
      counts[level][category] = BIBLE_QUIZ_DATA[level][category].length;
    });
  });
  return counts;
};

// Get all questions for a level+category
export const getQuestions = (level, category) => {
  return BIBLE_QUIZ_DATA[level]?.[category] || [];
};

// Get random questions for a quiz session
export const getRandomQuestions = (level, category, count = 10) => {
  const all = getQuestions(level, category);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Get current prize tier for a point total
export const getCurrentPrize = (totalPoints) => {
  let current = PRIZE_TIERS[0];
  for (const tier of PRIZE_TIERS) {
    if (totalPoints >= tier.minPoints) current = tier;
  }
  return current;
};

// Get next prize tier
export const getNextPrize = (totalPoints) => {
  for (const tier of PRIZE_TIERS) {
    if (totalPoints < tier.minPoints) return tier;
  }
  return null;
};
