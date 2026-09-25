const INITIAL_TRIVIA = {
  easy: [
    {
      question: "Who built the ark?",
      options: ["Moses", "Noah", "Abraham", "David"],
      answer: "Noah",
      explanation: "Genesis 6:14-22. Noah built the ark out of gopher wood, exactly as God instructed, to save his family and the animals from the great flood."
    },
    {
      question: "What is the first book of the Bible?",
      options: ["Exodus", "Genesis", "Matthew", "Psalms"],
      answer: "Genesis",
      explanation: "Genesis is the book of beginnings, detailing the creation of the world, early human history, and God's covenant with Abraham."
    },
    {
      question: "Who was swallowed by a great fish?",
      options: ["Jonah", "Daniel", "Samson", "Paul"],
      answer: "Jonah",
      explanation: "Jonah 1:17. God prepared a great fish to swallow Jonah after he ran away from his mission to preach in Nineveh."
    },
    {
      question: "How many disciples did Jesus choose?",
      options: ["7", "10", "12", "40"],
      answer: "12",
      explanation: "Matthew 10:1-4. Jesus chose twelve disciples, representing the twelve tribes of Israel, to walk with Him and share His ministry."
    },
    {
      question: "What giant did David defeat with a sling and a stone?",
      options: ["Saul", "Goliath", "Absalom", "Pharaoh"],
      answer: "Goliath",
      explanation: "1 Samuel 17. Armed with only a sling, five smooth stones, and absolute faith in God, the shepherd boy David defeated the giant Goliath."
    },
    {
      question: "What did God use to make the first woman, Eve?",
      options: ["Dust", "A rib from Adam", "A flower", "Light"],
      answer: "A rib from Adam",
      explanation: "Genesis 2:22. God took one of Adam's ribs and fashioned it into the first woman, Eve, to be his partner."
    },
    {
      question: "Where was Jesus born?",
      options: ["Nazareth", "Jerusalem", "Bethlehem", "Rome"],
      answer: "Bethlehem",
      explanation: "Luke 2:4-7. Joseph and Mary traveled to Bethlehem, the city of David, where Jesus was born in a manger because there was no room in the inn."
    },
    {
      question: "What is the last book of the New Testament?",
      options: ["Jude", "Revelation", "Hebrews", "Acts"],
      answer: "Revelation",
      explanation: "The Book of Revelation, written by the Apostle John on the island of Patmos, is the final book of the Bible."
    },
    {
      question: "Who received the Ten Commandments from God on Mount Sinai?",
      options: ["Abraham", "Noah", "Moses", "Joshua"],
      answer: "Moses",
      explanation: "Exodus 19-20. Moses went up Mount Sinai, where God spoke to him and inscribed the Ten Commandments on two stone tablets."
    },
    {
      question: "Which disciple denied Jesus three times before the rooster crowed?",
      options: ["Judas", "Thomas", "John", "Peter"],
      answer: "Peter",
      explanation: "Matthew 26:75. Just as Jesus predicted, Peter denied knowing Him three times out of fear, and wept bitterly when the rooster crowed."
    },
    {
      question: "Who was the first man created?",
      options: ["Noah", "Adam", "Cain", "Seth"],
      answer: "Adam",
      explanation: "Genesis 2:7. God formed Adam from the dust of the ground and breathed into his nostrils the breath of life."
    },
    {
      question: "What did God create on the first day of creation?",
      options: ["Sun and Moon", "Plants", "Light", "Animals"],
      answer: "Light",
      explanation: "Genesis 1:3-5. God said, 'Let there be light,' separating the light from the darkness on the first day."
    },
    {
      question: "Who was thrown into the lions' den?",
      options: ["Daniel", "Shadrach", "Abednego", "Joseph"],
      answer: "Daniel",
      explanation: "Daniel 6. Daniel was thrown into the lions' den for praying to God instead of the king, but God shut the lions' mouths."
    },
    {
      question: "Who was the mother of Jesus?",
      options: ["Ruth", "Esther", "Mary", "Martha"],
      answer: "Mary",
      explanation: "Luke 1:26-38. The angel Gabriel visited Mary to announce she would give birth to Jesus through the Holy Spirit."
    },
    {
      question: "How many books are in the entire Protestant Bible?",
      options: ["39", "66", "73", "100"],
      answer: "66",
      explanation: "The Protestant Bible contains 66 books: 39 in the Old Testament and 27 in the New Testament."
    },
    {
      question: "Who was sold into slavery by his jealous brothers?",
      options: ["Benjamin", "Joseph", "Reuben", "Levi"],
      answer: "Joseph",
      explanation: "Genesis 37. Joseph's brothers sold him to Ishmaelite merchants due to their jealousy over his dreams and his father's favoritism."
    },
    {
      question: "Who was Joseph's father, who had twelve sons?",
      options: ["Abraham", "Isaac", "Jacob", "Esau"],
      answer: "Jacob",
      explanation: "Genesis 35:22. Jacob (later named Israel) was the father of the twelve patriarchs of the tribes of Israel."
    },
    {
      question: "The rainbow is a sign of what covenant by God?",
      options: ["Never to destroy the earth by water again", "To give Abraham land", "To make Moses a leader", "To bless King David"],
      answer: "Never to destroy the earth by water again",
      explanation: "Genesis 9:11-13. God placed the rainbow in the clouds as a sign of His covenant with Noah and all living creatures."
    },
    {
      question: "What was the name of the garden where Adam and Eve first lived?",
      options: ["Garden of Gethsemane", "Garden of Eden", "Garden of Carmel", "Garden of Babylon"],
      answer: "Garden of Eden",
      explanation: "Genesis 2:8. God planted a garden eastward in Eden, and there He put the man whom He had formed."
    },
    {
      question: "Who was Moses' older brother and first high priest?",
      options: ["Aaron", "Joshua", "Caleb", "Hur"],
      answer: "Aaron",
      explanation: "Exodus 4:14. God appointed Aaron to be Moses' spokesperson because of his eloquence, and he became Israel's first High Priest."
    },
    {
      question: "What bread-like food did God provide to the Israelites in the wilderness?",
      options: ["Manna", "Leaven", "Unleavened bread", "Figs"],
      answer: "Manna",
      explanation: "Exodus 16:15. When the Israelites saw it, they said to each other, 'What is it?' (Manna), for they did not know what it was."
    },
    {
      question: "How many days and nights did it rain during Noah's flood?",
      options: ["7 days", "12 days", "40 days", "150 days"],
      answer: "40 days",
      explanation: "Genesis 7:12. And rain fell on the earth forty days and forty nights during the great flood."
    },
    {
      question: "Who was promised by God to be the 'father of many nations'?",
      options: ["Moses", "Abraham", "Isaac", "David"],
      answer: "Abraham",
      explanation: "Genesis 17:5. God changed his name from Abram to Abraham, which means 'father of a multitude'."
    },
    {
      question: "What body of water did Moses part to help the Israelites escape Egypt?",
      options: ["Jordan River", "Red Sea", "Dead Sea", "Sea of Galilee"],
      answer: "Red Sea",
      explanation: "Exodus 14. Moses stretched out his hand over the sea, and the Lord drove the sea back with a strong east wind, turning it into dry land."
    },
    {
      question: "Who committed the first murder in the Bible by killing his brother Abel?",
      options: ["Cain", "Seth", "Lamech", "Enoch"],
      answer: "Cain",
      explanation: "Genesis 4:8. Cain attacked his brother Abel and killed him out of jealousy because God looked with favor on Abel's offering."
    },
    {
      question: "Who was the strongest man in the Bible, whose power was tied to his hair?",
      options: ["Gideon", "Samson", "David", "Saul"],
      answer: "Samson",
      explanation: "Judges 13-16. Samson was a Nazirite from birth, given supernatural strength by God to fight the Philistines."
    },
    {
      question: "Who was the shepherd boy who wrote many of the Psalms and became king?",
      options: ["Solomon", "Samuel", "David", "Nathan"],
      answer: "David",
      explanation: "David, the youngest son of Jesse, was anointed by Samuel and became Israel's greatest king and main composer of the Psalms."
    },
    {
      question: "What happened to Lot's wife when she looked back at Sodom?",
      options: ["She turned into a pillar of salt", "She caught fire", "She fell into a pit", "She turned into a tree"],
      answer: "She turned into a pillar of salt",
      explanation: "Genesis 19:26. Lot's wife looked back from behind him, and she became a pillar of salt as Sodom was being destroyed."
    },
    {
      question: "Who was Abraham's miraculous son born to Sarah in her old age?",
      options: ["Ishmael", "Isaac", "Jacob", "Joseph"],
      answer: "Isaac",
      explanation: "Genesis 21:1-3. Sarah gave birth to Isaac when Abraham was 100 years old, fulfilling God's promise."
    },
    {
      question: "How did Judas identify Jesus to the arresting soldiers?",
      options: ["With a shout", "With a handshake", "With a kiss", "By pointing his finger"],
      answer: "With a kiss",
      explanation: "Matthew 26:48-49. Judas had arranged a signal, saying, 'The one I kiss is the man; arrest him.' He went to Jesus and said, 'Greetings, Rabbi!' and kissed him."
    },
    {
      question: "How did Jesus die?",
      options: ["Beheaded", "Stoned", "Crucified", "Drowned"],
      answer: "Crucified",
      explanation: "Jesus was crucified by Roman soldiers at Golgotha, bearing the sins of humanity on the cross."
    },
    {
      question: "What is the longest book in the Bible?",
      options: ["Isaiah", "Genesis", "Psalms", "Jeremiah"],
      answer: "Psalms",
      explanation: "The Book of Psalms contains 150 individual songs, prayers, and poems, making it the longest book by chapter count."
    },
    {
      question: "Who was Jesus' earthly guardian/father figure?",
      options: ["John", "Joseph", "Zechariah", "Simeon"],
      answer: "Joseph",
      explanation: "Matthew 1. Joseph was a righteous carpenter betrothed to Mary, who raised Jesus as his own son."
    },
    {
      question: "Who was the short tax collector who climbed a sycamore tree to see Jesus?",
      options: ["Zacchaeus", "Matthew", "Nicodemus", "Barnabas"],
      answer: "Zacchaeus",
      explanation: "Luke 19:1-10. Zacchaeus climbed a sycamore-fig tree to see Jesus because he was short. Jesus saw him and dined at his house."
    },
    {
      question: "What did Jesus turn water into at the wedding feast of Cana?",
      options: ["Milk", "Wine", "Honey", "Oil"],
      answer: "Wine",
      explanation: "John 2:1-11. At His mother Mary's request, Jesus turned six stone waterjars of water into the finest wine, His first public miracle."
    },
    {
      question: "Who was Abraham's wife, who laughed when told she would have a baby?",
      options: ["Sarah", "Hagar", "Rebekah", "Rachel"],
      answer: "Sarah",
      explanation: "Genesis 18:12. Sarah laughed to herself, thinking she was too old to bear a child, but God proved nothing is too difficult for Him."
    },
    {
      question: "Who was Samuel's godly mother, who prayed fervently for a child?",
      options: ["Hannah", "Peninnah", "Elizabeth", "Ruth"],
      answer: "Hannah",
      explanation: "1 Samuel 1. Hannah wept and prayed to God for a son, promising to dedicate him to God's service. God answered her prayer with Samuel."
    },
    {
      question: "What was the name of the tower where God confused human languages?",
      options: ["Tower of Babel", "Tower of Siloam", "Tower of Shechem", "Tower of David"],
      answer: "Tower of Babel",
      explanation: "Genesis 11:1-9. God confused human languages at the Tower of Babel to halt the prideful building of a city reaching to the heavens."
    },
    {
      question: "How many days was Jesus in the tomb before His resurrection?",
      options: ["1 day", "3 days", "7 days", "40 days"],
      answer: "3 days",
      explanation: "Matthew 12:40. Jesus rose on the third day, fulfilling scriptures and His own prophecy that He would rise again."
    },
    {
      question: "Which Apostle wrote most of the letters (epistles) in the New Testament?",
      options: ["Peter", "John", "Paul", "James"],
      answer: "Paul",
      explanation: "The Apostle Paul authored 13 (or 14 if Hebrews is counted) of the 27 books in the New Testament, laying out core Christian theology."
    },
    {
      question: "What musical instrument did David play to soothe King Saul?",
      options: ["Harp", "Flute", "Trumpet", "Cymbal"],
      answer: "Harp",
      explanation: "1 Samuel 16:23. Whenever the spirit from God came upon Saul, David would take his harp and play, providing relief to Saul."
    },
    {
      question: "Who was selected as the very first king of Israel?",
      options: ["David", "Saul", "Solomon", "Samuel"],
      answer: "Saul",
      explanation: "1 Samuel 10. Saul, from the tribe of Benjamin, was anointed by the prophet Samuel as Israel's first king."
    },
    {
      question: "Who was David's loyal best friend, who was also King Saul's son?",
      options: ["Jonathan", "Abner", "Absalom", "Mephibosheth"],
      answer: "Jonathan",
      explanation: "1 Samuel 18:1. The soul of Jonathan was knit to the soul of David, and Jonathan loved him as his own soul."
    },
    {
      question: "What three Hebrew men were thrown into the blazing fiery furnace?",
      options: ["Daniel, Hosea, Joel", "Shadrach, Meshach, Abednego", "Ezra, Nehemiah, Tobit", "Peter, James, John"],
      answer: "Shadrach, Meshach, Abednego",
      explanation: "Daniel 3. These three men refused to bow down to King Nebuchadnezzar's golden image and were saved by God in the midst of the furnace."
    },
    {
      question: "What was Jesus' trade/occupation before His public ministry?",
      options: ["Fisherman", "Carpenter", "Shepherd", "Tentmaker"],
      answer: "Carpenter",
      explanation: "Mark 6:3. The crowd in His hometown asked, 'Isn't this the carpenter? Isn't this Mary's son?' referring to His family business."
    },
    {
      question: "What did the dove bring back to Noah, showing that floodwaters were receding?",
      options: ["An olive leaf", "A fig branch", "A wheat stalk", "A flower"],
      answer: "An olive leaf",
      explanation: "Genesis 8:11. The dove returned to Noah in the evening with a freshly plucked olive leaf in its beak, showing land was drying."
    },
    {
      question: "What was John the Baptist's clothing made of?",
      options: ["Camel's hair", "Sheep wool", "Linen", "Silk"],
      answer: "Camel's hair",
      explanation: "Matthew 3:4. John's clothes were made of camel's hair, and he had a leather belt around his waist, surviving in the desert."
    },
    {
      question: "What Philistine city's walls fell after the Israelites marched around it for seven days?",
      options: ["Jericho", "Gaza", "Gibeon", "Ashdod"],
      answer: "Jericho",
      explanation: "Joshua 6. The walls of Jericho collapsed outward after the priests blew trumpets and the Israelite army gave a loud shout."
    },
    {
      question: "What did Esau sell his birthright to Jacob for?",
      options: ["A flock of sheep", "Silver coins", "A bowl of lentil stew", "A coat of mail"],
      answer: "A bowl of lentil stew",
      explanation: "Genesis 25:29-34. Famished from the open country, Esau sold his birthright to Jacob for some bread and red lentil stew."
    },
    {
      question: "Who was Joseph's full younger brother, the youngest of Jacob's sons?",
      options: ["Benjamin", "Reuben", "Simeon", "Dan"],
      answer: "Benjamin",
      explanation: "Genesis 35:18. Rachel gave birth to Benjamin, Jacob's twelfth and final son, dying in childbirth."
    },
    {
      question: "Who was the oldest man recorded in the Bible, living to be 969 years?",
      options: ["Noah", "Methuselah", "Enoch", "Jared"],
      answer: "Methuselah",
      explanation: "Genesis 5:27. Methuselah lived for 969 years before he died, representing longevity in human history."
    },
    {
      question: "Who baptized Jesus in the Jordan River?",
      options: ["Apostle Peter", "John the Baptist", "James", "Nicodemus"],
      answer: "John the Baptist",
      explanation: "Matthew 3:13-17. John baptized Jesus to 'fulfill all righteousness,' after which the Holy Spirit descended like a dove."
    },
    {
      question: "On what mountain did Moses receive the Ten Commandments?",
      options: ["Mount Sinai", "Mount Ararat", "Mount Carmel", "Mount of Olives"],
      answer: "Mount Sinai",
      explanation: "Exodus 19. God descended on Mount Sinai in fire, summoning Moses to the mountaintop to deliver His law."
    },
    {
      question: "What food did Jesus use to miraculously feed the 5,000?",
      options: ["Five loaves and two fish", "Seven loaves and three fish", "Manna and quail", "Bread and wine"],
      answer: "Five loaves and two fish",
      explanation: "John 6:9. A young boy provided five barley loaves and two small fish, which Jesus blessed and multiplied to feed the crowd."
    },
    {
      question: "Which sister of Lazarus worked and complained while her sister Mary listened to Jesus?",
      options: ["Martha", "Ruth", "Esther", "Elizabeth"],
      answer: "Martha",
      explanation: "Luke 10:38-42. Martha was distracted by all the preparations, but Jesus noted Mary chose what was better by sitting at His feet."
    },
    {
      question: "What was David's primary occupation before Samuel anointed him?",
      options: ["Blacksmith", "Shepherd", "Scribe", "Soldier"],
      answer: "Shepherd",
      explanation: "1 Samuel 16:11. David was in the fields keeping his father Jesse's sheep when summoned to be anointed by Samuel."
    },
    {
      question: "How many times did Joshua's army march around Jericho on the seventh day?",
      options: ["1 time", "3 times", "7 times", "12 times"],
      answer: "7 times",
      explanation: "Joshua 6:15. On the seventh day, they got up at dawn and marched around the city seven times in the same manner."
    },
    {
      question: "What animal did God provide for Abraham to sacrifice instead of his son Isaac?",
      options: ["A ram", "A lamb", "A dove", "A bull"],
      answer: "A ram",
      explanation: "Genesis 22:13. Abraham looked up and saw a ram caught in a thicket by its horns. He sacrificed it instead of Isaac."
    },
    {
      question: "What Jewish orphan girl became Queen of Persia and saved her people from Haman?",
      options: ["Ruth", "Esther", "Deborah", "Vashti"],
      answer: "Esther",
      explanation: "The Book of Esther tells how Esther risked her life to appeal to King Ahasuerus and foil Haman's plot to destroy the Jews."
    },
    {
      question: "Who was Ruth's second husband, the guardian-redeemer who loved her?",
      options: ["Mahlon", "Boaz", "Chilion", "Elimelech"],
      answer: "Boaz",
      explanation: "Ruth 4. Boaz married Ruth the Moabite, and they became ancestors of King David and Jesus Christ."
    },
    {
      question: "What did the wise men (Magi) follow to find the young child Jesus?",
      options: ["A star", "A map", "A cloud", "An angel"],
      answer: "A star",
      explanation: "Matthew 2:2. The Magi asked, 'Where is the one who has been born king of the Jews? We saw his star in the east and have come to worship him.'"
    },
    {
      question: "What is the shortest verse in the entire Bible?",
      options: ["Jesus wept", "Pray without ceasing", "God is love", "Rejoice always"],
      answer: "Jesus wept",
      explanation: "John 11:35. At the tomb of His friend Lazarus, Jesus wept, showing His deep human compassion and sorrow."
    },
    {
      question: "Who was the high priest who raised and mentored the young prophet Samuel?",
      options: ["Eli", "Hophni", "Phinehas", "Abiathar"],
      answer: "Eli",
      explanation: "1 Samuel 1-3. Samuel was dedicated to God's temple service under Eli the priest at Shiloh."
    },
    {
      question: "Who wrote the Book of Revelation?",
      options: ["Paul", "Peter", "John", "Luke"],
      answer: "John",
      explanation: "Revelation 1:9. John, exiled on the island of Patmos, wrote down the prophetic vision given to him by Jesus."
    },
    {
      question: "In what language was most of the Old Testament written?",
      options: ["Greek", "Hebrew", "Latin", "Aramaic"],
      answer: "Hebrew",
      explanation: "The Old Testament was originally written in Hebrew, with a few small portions of Ezra and Daniel written in Aramaic."
    },
    {
      question: "In what language was most of the New Testament written?",
      options: ["Latin", "Hebrew", "Greek", "Aramaic"],
      answer: "Greek",
      explanation: "The New Testament was written in Koine Greek, the common language of the Mediterranean world during the first century AD."
    },
    {
      question: "Who was the sister of Moses and Aaron, who led Israel in musical praise?",
      options: ["Miriam", "Zipporah", "Deborah", "Hannah"],
      answer: "Miriam",
      explanation: "Exodus 15:20. Miriam the prophetess, Aaron's sister, took a timbrel and led the women in singing praises after crossing the Red Sea."
    },
    {
      question: "Who dreamed of a ladder reaching to heaven with angels ascending and descending?",
      options: ["Abraham", "Isaac", "Jacob", "Joseph"],
      answer: "Jacob",
      explanation: "Genesis 28:12. During his flight from Esau, Jacob dreamed of a ladder reaching to heaven, where God reaffirmed His covenant."
    },
    {
      question: "What mountain did Abraham climb to offer Isaac as a sacrifice?",
      options: ["Mount Sinai", "Mount Moriah", "Mount Nebo", "Mount Hermon"],
      answer: "Mount Moriah",
      explanation: "Genesis 22:2. God said, 'Take your son, your only son, whom you love—Isaac—and go to the region of Moriah. Sacrifice him there...'"
    },
    {
      question: "How did Samson lose his legendary Nazirite strength?",
      options: ["Delilah cut his hair", "He drank wine", "He touched a dead body", "He broke his sword"],
      answer: "Delilah cut his hair",
      explanation: "Judges 16. Samson's strength departed after Delilah coaxed his secret from him and had a man shave off the seven braids of his hair while he slept."
    },
    {
      question: "With which woman did King David commit adultery, leading to a great coverup?",
      options: ["Bathsheba", "Michal", "Abigail", "Maakah"],
      answer: "Bathsheba",
      explanation: "2 Samuel 11. David saw Bathsheba bathing, sent for her, and committed adultery, later arranging the death of her husband Uriah."
    },
    {
      question: "How many books are in the New Testament?",
      options: ["27", "39", "46", "50"],
      answer: "27",
      explanation: "The New Testament contains exactly 27 books, beginning with the Gospel of Matthew and ending with Revelation."
    },
    {
      question: "How many books are in the Protestant Old Testament?",
      options: ["27", "39", "46", "66"],
      answer: "39",
      explanation: "The Protestant Old Testament consists of 39 books, starting with Genesis and ending with Malachi."
    },
    {
      question: "Who was Israel's very first high priest, appointed by God?",
      options: ["Moses", "Aaron", "Eleazar", "Phinehas"],
      answer: "Aaron",
      explanation: "Exodus 28. God commanded Moses to set apart Aaron and his sons to serve as priests, with Aaron wearing the sacred garments as High Priest."
    },
    {
      question: "Which believer was chosen by lot to replace Judas Iscariot as the twelfth apostle?",
      options: ["Matthias", "Barnabas", "Justus", "Stephen"],
      answer: "Matthias",
      explanation: "Acts 1:26. The disciples cast lots, and the lot fell on Matthias; so he was added to the eleven apostles."
    },
    {
      question: "What was Saul of Tarsus' name changed to after meeting Jesus on the road to Damascus?",
      options: ["Peter", "Paul", "Silas", "Luke"],
      answer: "Paul",
      explanation: "Acts 13:9. Saul, who was also called Paul, began using his Roman name as he embarked on his mission to the Gentiles."
    },
    {
      question: "What is the very first of the Ten Commandments?",
      options: ["You shall not murder", "You shall have no other gods before me", "Honor your father and mother", "Remember the Sabbath"],
      answer: "You shall have no other gods before me",
      explanation: "Exodus 20:3. The first commandment establishes absolute monotheism, declaring that God alone must be worshiped."
    },
    {
      question: "Where did the Hebrew people live as slaves for over 400 years?",
      options: ["Babylon", "Egypt", "Rome", "Persia"],
      answer: "Egypt",
      explanation: "Exodus 1. The descendants of Jacob multiplied in Egypt, but a new Pharaoh arose who enslaved them and forced them into hard labor."
    },
    {
      question: "What special gift did Jacob give to his favorite son, Joseph?",
      options: ["A golden ring", "A coat of many colors", "A silver cup", "A fine horse"],
      answer: "A coat of many colors",
      explanation: "Genesis 37:3. Israel loved Joseph more than any of his other sons, and he made an ornate robe (coat of many colors) for him."
    },
    {
      question: "Who was Naomi's loyal Moabite daughter-in-law who refused to leave her side?",
      options: ["Orpah", "Ruth", "Milcah", "Adah"],
      answer: "Ruth",
      explanation: "Ruth 1:16. Ruth famously said, 'Where you go I will go, and where you stay I will stay. Your people will be my people and your God my God.'"
    },
    {
      question: "Whom did Jesus raise from the dead in Bethany after he had been in the tomb for four days?",
      options: ["Lazarus", "Jairus' daughter", "The widow's son", "Tabitha"],
      answer: "Lazarus",
      explanation: "John 11. Jesus traveled to Bethany and cried in a loud voice, 'Lazarus, come out!' and the dead man walked out of the tomb wrapped in linens."
    },
    {
      question: "What is the term for the brief story lessons Jesus used to teach spiritual truths?",
      options: ["Parables", "Proverbs", "Epistles", "Psalms"],
      answer: "Parables",
      explanation: "Jesus frequently used parables—earthly stories with heavenly meanings, such as the Prodigal Son or Good Samaritan—to instruct listeners."
    },
    {
      question: "What does the Hebrew name 'Emmanuel' mean?",
      options: ["God with us", "God is my king", "Saved by grace", "He who hears"],
      answer: "God with us",
      explanation: "Matthew 1:23. Quoting Isaiah, the angel states that the virgin will conceive a son, and they will call him Emmanuel, meaning 'God with us.'"
    },
    {
      question: "What is the common name for the command to 'do to others what you would have them do to you'?",
      options: ["The Golden Rule", "The Great Commandment", "The Beatitude", "The Great Commission"],
      answer: "The Golden Rule",
      explanation: "Matthew 7:12. Jesus summarized the Law and the Prophets in this simple ethical rule of mutual love and empathy."
    },
    {
      question: "Who was the oldest son of Adam and Eve, who farmed the land?",
      options: ["Cain", "Abel", "Seth", "Enoch"],
      answer: "Cain",
      explanation: "Genesis 4:1-2. Eve gave birth to Cain first, saying, 'With the help of the Lord I have brought forth a man.' He worked the soil."
    },
    {
      question: "What was Simon Peter's trade before he became a fisher of men?",
      options: ["Tentmaker", "Fisherman", "Tax collector", "Scribe"],
      answer: "Fisherman",
      explanation: "Luke 5:1-11. Peter and his partners James and John were commercial fishermen on the Sea of Galilee before Jesus called them."
    },
    {
      question: "How many brothers did Joseph have in the Old Testament?",
      options: ["10 brothers", "11 brothers", "12 brothers", "7 brothers"],
      answer: "11 brothers",
      explanation: "Genesis 35:22. Jacob had 12 sons in total, so Joseph had 11 brothers, with Benjamin being the only other son of Rachel."
    },
    {
      question: "What event happened to Jesus 40 days after His resurrection?",
      options: ["His baptism", "His Ascension to heaven", "The Transfiguration", "The Temptation"],
      answer: "His Ascension to heaven",
      explanation: "Acts 1:9. After speaking to His disciples, Jesus was taken up before their very eyes, and a cloud hid Him from their sight."
    },
    {
      question: "What is the name of the river where Jesus was baptized by John?",
      options: ["Nile River", "Euphrates River", "Jordan River", "Tigris River"],
      answer: "Jordan River",
      explanation: "Mark 1:9. At that time Jesus came from Nazareth in Galilee and was baptized by John in the Jordan."
    },
    {
      question: "Who was the Roman governor of Judea who authorized the crucifixion of Jesus?",
      options: ["Herod Antipas", "Pontius Pilate", "Caesar Augustus", "Felix"],
      answer: "Pontius Pilate",
      explanation: "Matthew 27. Pilate found no guilt in Jesus but succumbed to public pressure and ordered Him to be scourged and crucified."
    },
    {
      question: "According to 1 Timothy 6:10, what is the root of all kinds of evil?",
      options: ["The love of money", "Pride", "Alcohol", "Idolatry"],
      answer: "The love of money",
      explanation: "1 Timothy 6:10. 'For the love of money is a root of all kinds of evil. Some people, eager for money, have wandered from the faith.'"
    },
    {
      question: "How many days and nights did Jesus fast in the wilderness before His temptation?",
      options: ["7 days", "12 days", "40 days", "100 days"],
      answer: "40 days",
      explanation: "Matthew 4:2. After fasting forty days and forty nights, Jesus was hungry, and the tempter came to Him."
    },
    {
      question: "What is the name of the mountain where God spoke to Moses from a burning bush?",
      options: ["Mount Horeb", "Mount Nebo", "Mount Tabor", "Mount Hermon"],
      answer: "Mount Horeb",
      explanation: "Exodus 3:1. Moses led his flock to the far side of the wilderness and came to Horeb, the mountain of God, where the angel appeared in flames."
    },
    {
      question: "What was David's weapon of choice when confronting the giant Goliath?",
      options: ["A heavy sword", "A bronze spear", "A sling and five smooth stones", "A composite bow"],
      answer: "A sling and five smooth stones",
      explanation: "1 Samuel 17:40. David took his staff, chose five smooth stones from the stream, put them in his shepherd's bag and took his sling."
    },
    {
      question: "How many times did Jesus tell Peter we must forgive our brother who sins against us?",
      options: ["7 times", "70 times", "Seventy times seven", "As many as they ask"],
      answer: "Seventy times seven",
      explanation: "Matthew 18:22. Jesus answered, 'I tell you, not seven times, but seventy-seven times' (or seventy times seven, indicating limitless forgiveness)."
    },
    {
      question: "Who was the mighty King of Babylon who destroyed Jerusalem and carried off the Jews?",
      options: ["Cyrus", "Darius", "Nebuchadnezzar", "Artaxerxes"],
      answer: "Nebuchadnezzar",
      explanation: "2 Kings 25. King Nebuchadnezzar of Babylon besieged Jerusalem, broke down its walls, burned the temple, and exiled the inhabitants."
    },
    {
      question: "What was the very first city conquered by the Israelites under Joshua's command?",
      options: ["Ai", "Jericho", "Gibeon", "Hazor"],
      answer: "Jericho",
      explanation: "Joshua 6. Jericho was a tightly shut fortified city, but its walls collapsed miraculously under the Lord's instructions."
    },
    {
      question: "What is the final word of the Bible, closing the Book of Revelation?",
      options: ["Hallelujah", "Amen", "Forever", "Holy"],
      answer: "Amen",
      explanation: "Revelation 22:21. The final verse of the Bible reads: 'The grace of the Lord Jesus be with God's people. Amen.'"
    }
  ],
  hard: [
    {
      question: "Which king of Israel asked God for wisdom instead of wealth or long life?",
      options: ["David", "Saul", "Solomon", "Hezekiah"],
      answer: "Solomon",
      explanation: "1 Kings 3. Pleased that Solomon did not ask for selfish gains, God gave him unmatched wisdom, as well as riches and honor."
    },
    {
      question: "Who was the first Christian martyr in the New Testament?",
      options: ["Stephen", "Peter", "Paul", "James"],
      answer: "Stephen",
      explanation: "Acts 7:54-60. Stephen, full of grace and power, was stoned to death for testifying to the glory of Jesus, praying for his executors as he died."
    },
    {
      question: "What was the name of Abraham's second wife, whom he married after Sarah's death?",
      options: ["Hagar", "Keturah", "Rebekah", "Leah"],
      answer: "Keturah",
      explanation: "Genesis 25:1. After Sarah passed away, Abraham married Keturah, who bore him six sons."
    },
    {
      question: "How many years did the Israelites wander in the wilderness before entering Canaan?",
      options: ["7 years", "12 years", "40 years", "70 years"],
      answer: "40 years",
      explanation: "Numbers 14:34. Due to their rebellion and lack of faith in entering the Promised Land, they were sentenced to wander forty years."
    },
    {
      question: "What was the name of the place where Jesus was crucified?",
      options: ["Gethsemane", "Golgotha", "Capernaum", "Bethlehem"],
      answer: "Golgotha",
      explanation: "John 19:17. Golgotha (Aramaic for 'The Place of the Skull') is the hill outside Jerusalem's walls where Christ was crucified."
    },
    {
      question: "What did John the Baptist eat in the wilderness?",
      options: ["Bread and fish", "Wild berries and honey", "Locusts and wild honey", "Grapes and figs"],
      answer: "Locusts and wild honey",
      explanation: "Matthew 3:4. John the Baptist wore clothes made of camel's hair and survived on locusts and wild honey."
    },
    {
      question: "Which judge of Israel defeated the Midianites with only 300 men carrying horns and jars?",
      options: ["Samson", "Gideon", "Barak", "Jephthah"],
      answer: "Gideon",
      explanation: "Judges 7. God whittled Gideon's army down to 300 to show that the victory belonged to the Lord, utilizing trumpets and torch jars to panic the Midianites."
    },
    {
      question: "Who was the father of Abraham?",
      options: ["Terah", "Nahor", "Haran", "Lot"],
      answer: "Terah",
      explanation: "Genesis 11:27. Terah was the father of Abram (Abraham), Nahor, and Haran, who originally lived in Ur of the Chaldeans."
    },
    {
      question: "Which prophet challenged the prophets of Baal on Mount Carmel?",
      options: ["Elisha", "Elijah", "Isaiah", "Jeremiah"],
      answer: "Elijah",
      explanation: "1 Kings 18. Elijah repaired the altar of God, prayed, and fire fell from heaven, proving God was the true Lord over Baal."
    },
    {
      question: "What was the occupation of the Apostle Luke?",
      options: ["Tax Collector", "Fisherman", "Physician", "Tentmaker"],
      answer: "Physician",
      explanation: "Colossians 4:14. Paul refers to him as 'Luke, the beloved physician,' who also wrote the Gospel of Luke and Acts."
    },
    {
      question: "Who was the high priest of Israel during Jesus' trial?",
      options: ["Annas", "Caiaphas", "Aaron", "Eli"],
      answer: "Caiaphas",
      explanation: "John 18:13-14. Caiaphas was the high priest that year who had advised the Jewish leaders that it would be good if one man died for the people."
    },
    {
      question: "Which of Jacob's wives was the mother of Joseph and Benjamin?",
      options: ["Leah", "Rachel", "Bilhah", "Zilpah"],
      answer: "Rachel",
      explanation: "Genesis 30:22-24. Rachel, Jacob's beloved wife, suffered years of barrenness before giving birth to Joseph, and later Benjamin."
    },
    {
      question: "What prophet wrote the Lamentations over the destruction of Jerusalem?",
      options: ["Ezekiel", "Jeremiah", "Daniel", "Baruch"],
      answer: "Jeremiah",
      explanation: "Jeremiah is traditionally credited with writing Lamentations, expressing deep sorrow over the fall of Jerusalem to Babylon."
    },
    {
      question: "What was the original name of the city of Jerusalem when Melchizedek was king?",
      options: ["Salem", "Jebus", "Hebron", "Zion"],
      answer: "Salem",
      explanation: "Genesis 14:18. Melchizedek, king of Salem and priest of God Most High, brought out bread and wine to bless Abram."
    },
    {
      question: "Who was the woman who hid the Israelite spies in Jericho?",
      options: ["Rahab", "Delilah", "Ruth", "Deborah"],
      answer: "Rahab",
      explanation: "Joshua 2. Rahab the prostitute hid the two spies on her roof and was saved along with her family when the city fell."
    },
    {
      question: "How many books are in the Catholic Old Testament, including deuterocanonical books?",
      options: ["39", "46", "54", "73"],
      answer: "46",
      explanation: "The Catholic Old Testament includes 46 books, containing deuterocanonical texts like Tobit, Judith, and Maccabees."
    },
    {
      question: "Which king of Judah was healed of sickness and had his life extended by 15 years?",
      options: ["Hezekiah", "Josiah", "Uzziah", "Rehoboth"],
      answer: "Hezekiah",
      explanation: "2 Kings 20. Hezekiah wept and prayed, and God sent Isaiah to tell him He would heal him and add fifteen years to his life."
    },
    {
      question: "What was the name of the place where Jacob wrestled with an angel and was renamed Israel?",
      options: ["Bethel", "Peniel", "Shechem", "Shiloh"],
      answer: "Peniel",
      explanation: "Genesis 32:30. Jacob called the place Peniel, saying, 'It is because I saw God face to face, and yet my life was spared.'"
    },
    {
      question: "Which prophet was fed by ravens near the Kerith Ravine?",
      options: ["Elisha", "Elijah", "Isaiah", "Hosea"],
      answer: "Elijah",
      explanation: "1 Kings 17:4-6. God commanded Elijah to hide during the drought, promising ravens would bring him bread and meat morning and evening."
    },
    {
      question: "Who wrote the New Testament Epistle of James?",
      options: ["James the brother of John", "James the brother of Jesus", "James the son of Alphaeus", "James the Elder"],
      answer: "James the brother of Jesus",
      explanation: "The author is widely recognized as James, the brother of Jesus and leader of the early Jerusalem church."
    },
    {
      question: "What was the name of the garden where Jesus prayed in agony before His arrest?",
      options: ["Gethsemane", "Golgotha", "Eden", "Siloam"],
      answer: "Gethsemane",
      explanation: "Matthew 26:36. Jesus went with His disciples to a place called Gethsemane on the Mount of Olives to pray."
    },
    {
      question: "Who was the first king of the northern kingdom of Israel after the nation split?",
      options: ["Rehoboam", "Jeroboam", "Ahab", "Jehu"],
      answer: "Jeroboam",
      explanation: "1 Kings 12. Jeroboam lead the ten northern tribes in rebellion against Solomon's son, Rehoboam, forming the Northern Kingdom."
    },
    {
      question: "Who was the son of Solomon who succeeded him and caused the kingdom to split?",
      options: ["Jeroboam", "Rehoboam", "Abijah", "Asa"],
      answer: "Rehoboam",
      explanation: "1 Kings 12. Rehoboam rejected the counsel of the elders, demanding harsher taxes, which caused the ten northern tribes to secede."
    },
    {
      question: "How many chapters are in the Book of Isaiah?",
      options: ["50", "66", "100", "150"],
      answer: "66",
      explanation: "Isaiah has exactly 66 chapters, matching the number of books in the Bible, split structurally between judgment and comfort."
    },
    {
      question: "What was the name of the apostle who was a member of a radical political group before following Jesus?",
      options: ["Matthew", "Simon the Zealot", "Thaddaeus", "Philip"],
      answer: "Simon the Zealot",
      explanation: "Luke 6:15. Simon was known as a 'Zealot,' indicating his connection to the Jewish nationalist movement against Rome."
    },
    {
      question: "What is the name of the sea where Jesus calmed a fierce storm?",
      options: ["Dead Sea", "Red Sea", "Sea of Galilee", "Mediterranean Sea"],
      answer: "Sea of Galilee",
      explanation: "Mark 4:35-41. Jesus was sleeping in the stern when a storm arose. He woke and said to the waves, 'Quiet! Be still!'"
    },
    {
      question: "What judge of Israel made a foolish vow that cost the life of his only daughter?",
      options: ["Gideon", "Jephthah", "Samson", "Ehud"],
      answer: "Jephthah",
      explanation: "Judges 11. Jephthah vowed to sacrifice whatever came out of his door first upon his victory over the Ammonites, which was his daughter."
    },
    {
      question: "Who was the father of John the Baptist?",
      options: ["Zechariah", "Simeon", "Joseph", "Elkanah"],
      answer: "Zechariah",
      explanation: "Luke 1. Zechariah was a priest of the division of Abijah who was struck mute for doubting Gabriel's announcement of John's birth."
    },
    {
      question: "What queen of Israel sought to kill Elijah and established Baal worship?",
      options: ["Athaliah", "Jezebel", "Esther", "Herodias"],
      answer: "Jezebel",
      explanation: "1 Kings 19. Jezebel, wife of King Ahab, was infamous for killing God's prophets and threatening Elijah's life."
    },
    {
      question: "Which of the seven churches of Revelation is rebuked for being 'lukewarm'?",
      options: ["Ephesus", "Sardis", "Laodicea", "Philadelphia"],
      answer: "Laodicea",
      explanation: "Revelation 3:16. 'So, because you are lukewarm—neither hot nor cold—I am about to spit you out of my mouth.'"
    },
    {
      question: "What was the name of Ruth's first husband, who died in Moab?",
      options: ["Mahlon", "Chilion", "Boaz", "Elimelech"],
      answer: "Mahlon",
      explanation: "Ruth 1:5. Ruth was originally married to Mahlon, while her sister-in-law Orpah was married to Chilion, both sons of Naomi."
    },
    {
      question: "What prophet was swallowed by a great fish because he refused to preach to Nineveh?",
      options: ["Nahum", "Zephaniah", "Jonah", "Amos"],
      answer: "Jonah",
      explanation: "The Book of Jonah recounts his flight to Tarshish, his survival inside the fish, and his eventual obedience in preaching to Nineveh."
    },
    {
      question: "Who was the priest-king of Salem who blessed Abraham in Genesis?",
      options: ["Melchizedek", "Abimelech", "Jethro", "Balaam"],
      answer: "Melchizedek",
      explanation: "Genesis 14. Melchizedek is a mysterious figure, a king of peace and righteousness, who foreshadowed Jesus Christ (Hebrews 7)."
    },
    {
      question: "In what town did Jesus perform His first public miracle of turning water to wine?",
      options: ["Cana", "Nazareth", "Capernaum", "Jerusalem"],
      answer: "Cana",
      explanation: "John 2:11. This, the first of his miraculous signs, Jesus performed at Cana in Galilee, revealing His glory."
    },
    {
      question: "Which of the Apostles was a tax collector before being called by Jesus?",
      options: ["Matthew", "Peter", "Andrew", "Thomas"],
      answer: "Matthew",
      explanation: "Matthew 9:9. Jesus saw a man named Matthew sitting at the tax collector's booth and said, 'Follow me.'"
    },
    {
      question: "How many plagues did God send upon Egypt to force Pharaoh to let Israel go?",
      options: ["7", "10", "12", "40"],
      answer: "10",
      explanation: "Exodus 7-12. God sent ten plagues, ending with the death of the firstborn, which broke Pharaoh's resistance."
    },
    {
      question: "What was the name of the mountain where Elijah challenged the prophets of Baal?",
      options: ["Mount Carmel", "Mount Sinai", "Mount Nebo", "Mount Hermon"],
      answer: "Mount Carmel",
      explanation: "1 Kings 18:19. Elijah said, 'Now summon the people from all over Israel to meet me on Mount Carmel...'"
    },
    {
      question: "Who was the father of Joshua, the leader who succeeded Moses?",
      options: ["Nun", "Caleb", "Eleazar", "Kish"],
      answer: "Nun",
      explanation: "Joshua 1:1. The Lord said to Joshua son of Nun, Moses' aide: 'Moses my servant is dead...'"
    },
    {
      question: "What island was the Apostle John exiled to when he wrote Revelation?",
      options: ["Crete", "Patmos", "Malta", "Cyprus"],
      answer: "Patmos",
      explanation: "Revelation 1:9. John writes, 'I... was on the island of Patmos because of the word of God and the testimony of Jesus.'"
    },
    {
      question: "How many streams or rivers did the river flowing out of Eden split into?",
      options: ["Two", "Three", "Four", "Seven"],
      answer: "Four",
      explanation: "Genesis 2:10. A river watering the garden flowed from Eden; from there it was separated into four headwaters: Pishon, Gihon, Tigris, and Euphrates."
    },
    {
      question: "What was the name of Moses' Midianite wife?",
      options: ["Zipporah", "Miriam", "Leah", "Orpah"],
      answer: "Zipporah",
      explanation: "Exodus 2:21. Moses agreed to stay with Jethro (Reuel), the priest of Midian, who gave his daughter Zipporah to Moses in marriage."
    },
    {
      question: "Which of the disciples is famous for doubting Jesus' resurrection until he saw the wounds?",
      options: ["Thomas", "Philip", "Bartholomew", "Jude"],
      answer: "Thomas",
      explanation: "John 20:25. Thomas said, 'Unless I see the nail marks in his hands... I will not believe.' He is often called 'Doubting Thomas.'"
    },
    {
      question: "What prophet walked through the city of Nineveh warning of its destruction?",
      options: ["Jonah", "Nahum", "Amos", "Joel"],
      answer: "Jonah",
      explanation: "Jonah 3. Jonah traveled Nineveh declaring, 'Forty more days and Nineveh will be overthrown,' leading to their complete repentance."
    },
    {
      question: "What was the name of David's rebellious son who hung by his hair in an oak tree?",
      options: ["Absalom", "Adonijah", "Amnon", "Solomon"],
      answer: "Absalom",
      explanation: "2 Samuel 18. Absalom's hair got caught in the branches of a large oak tree during a battle, leading to his death by Joab."
    },
    {
      question: "What was the name of the prophetess who judged Israel under a palm tree?",
      options: ["Deborah", "Ruth", "Miriam", "Huldah"],
      answer: "Deborah",
      explanation: "Judges 4:4-5. Deborah, a prophetess, was leading Israel. She held court under the Palm of Deborah."
    },
    {
      question: "Who was the father of David?",
      options: ["Jesse", "Saul", "Samuel", "Boaz"],
      answer: "Jesse",
      explanation: "1 Samuel 16. Jesse the Bethlehemite had eight sons, the youngest of whom was David, chosen by God."
    },
    {
      question: "What prophet saw a vision of a valley of dry bones coming to life?",
      options: ["Ezekiel", "Isaiah", "Jeremiah", "Daniel"],
      answer: "Ezekiel",
      explanation: "Ezekiel 37. God commanded Ezekiel to prophesy to the dry bones, representing the house of Israel being restored."
    },
    {
      question: "Which Gospel writer was a physician and close companion of Paul?",
      options: ["Luke", "Mark", "Matthew", "John"],
      answer: "Luke",
      explanation: "Luke, the author of the Gospel of Luke and the Acts of the Apostles, was a physician and traveled widely with Paul."
    },
    {
      question: "What is the name of the first city conquered by Israel in the Promised Land?",
      options: ["Jericho", "Ai", "Hebron", "Gibeon"],
      answer: "Jericho",
      explanation: "Joshua 6. The walls of Jericho fell flat after Israel marched around them for seven days blowing rams' horns."
    },
    {
      question: "In what town did Jesus raise Lazarus from the dead?",
      options: ["Bethany", "Nazareth", "Jerusalem", "Capernaum"],
      answer: "Bethany",
      explanation: "John 11. Lazarus and his sisters Mary and Martha lived in Bethany, a village about two miles from Jerusalem."
    },
    {
      question: "What did Moses throw into the bitter waters of Marah to make them sweet?",
      options: ["A piece of wood", "Salt", "His staff", "Sacred oil"],
      answer: "A piece of wood",
      explanation: "Exodus 15:25. Moses cried out to the Lord, and the Lord pointed out a piece of wood. He threw it into the water, and the water became fit to drink."
    },
    {
      question: "Who was the king of Persia who allowed the Jews to return and rebuild the temple?",
      options: ["Cyrus", "Darius", "Xerxes", "Artaxerxes"],
      answer: "Cyrus",
      explanation: "Ezra 1. Cyrus the Great issued a decree in his first year, fulfilling Jeremiah's prophecy, allowing the exiles to rebuild the temple."
    },
    {
      question: "Who was the mother of John the Baptist?",
      options: ["Elizabeth", "Mary", "Hannah", "Salome"],
      answer: "Elizabeth",
      explanation: "Luke 1. Elizabeth, a relative of Mary, was barren and advanced in years when she miraculously conceived John."
    },
    {
      question: "Who fell asleep during Paul's long sermon and fell from a third-story window?",
      options: ["Eutychus", "Tychicus", "Timothy", "Epaphras"],
      answer: "Eutychus",
      explanation: "Acts 20:9. Eutychus fell asleep in the window and fell down from the third loft, but Paul raised him back to life."
    },
    {
      question: "What city was Saul of Tarsus traveling to when he saw a blinding light and met Jesus?",
      options: ["Damascus", "Antioch", "Jerusalem", "Rome"],
      answer: "Damascus",
      explanation: "Acts 9. Saul was on his way to Damascus to arrest Christians when Jesus spoke to him in a brilliant light."
    },
    {
      question: "How many people were saved on Noah's Ark?",
      options: ["4", "8", "12", "20"],
      answer: "8",
      explanation: "1 Peter 3:20. In the ark, only a few people, eight in all (Noah, his wife, his three sons, and their wives), were saved through water."
    },
    {
      question: "What is the name of the place where God confused the languages of the earth?",
      options: ["Babel", "Nineveh", "Ur", "Sodom"],
      answer: "Babel",
      explanation: "Genesis 11. The people tried to build a tower to the heavens, so God scattered them by confusing their language at Babel."
    },
    {
      question: "Who wrote the New Testament Epistle of Jude?",
      options: ["Jude, brother of Jesus", "Judas Iscariot", "Jude son of James", "John"],
      answer: "Jude, brother of Jesus",
      explanation: "Jude 1:1. The author identifies himself as Jude, a servant of Jesus Christ and a brother of James, identifying him as Jesus' brother."
    },
    {
      question: "Which of Jacob's sons was his firstborn?",
      options: ["Reuben", "Simeon", "Levi", "Judah"],
      answer: "Reuben",
      explanation: "Genesis 29:32. Leah conceived and gave birth to a son, naming him Reuben, for she said, 'The Lord has seen my misery.'"
    },
    {
      question: "Who was Moses' father-in-law, the priest of Midian?",
      options: ["Jethro", "Balaam", "Melchizedek", "Laban"],
      answer: "Jethro",
      explanation: "Exodus 3:1. Moses was keeping the flock of Jethro (also called Reuel) his father-in-law, the priest of Midian."
    },
    {
      question: "What giant Philistine city was home to Goliath?",
      options: ["Gath", "Gaza", "Ashdod", "Ekron"],
      answer: "Gath",
      explanation: "1 Samuel 17:4. A champion named Goliath, who was from Gath, came out of the Philistine camp."
    },
    {
      question: "Who was the father of King Saul?",
      options: ["Kish", "Abner", "Ner", "Jonathan"],
      answer: "Kish",
      explanation: "1 Samuel 9:1. There was a Benjamite, a man of standing, whose name was Kish son of Abiel."
    },
    {
      question: "What did Jacob rename the town of Luz after dreaming of a ladder to heaven?",
      options: ["Bethel", "Peniel", "Shechem", "Hebron"],
      answer: "Bethel",
      explanation: "Genesis 28:19. Jacob called the place Bethel (house of God), though the city used to be called Luz."
    },
    {
      question: "What prophet was taken up to heaven in a whirlwind and chariot of fire?",
      options: ["Elijah", "Elisha", "Ezekiel", "Isaiah"],
      answer: "Elijah",
      explanation: "2 Kings 2:11. As they were walking along, a chariot of fire and horses of fire appeared, and Elijah went up to heaven in a whirlwind."
    },
    {
      question: "Who was the successor of Elijah as prophet of Israel?",
      options: ["Elisha", "Isaiah", "Jeremiah", "Samuel"],
      answer: "Elisha",
      explanation: "2 Kings 2. Elisha received a double portion of Elijah's spirit and succeeded him as the primary prophet to the Northern Kingdom."
    },
    {
      question: "How many fish did the disciples catch in their miraculous catch in John 21?",
      options: ["153", "120", "144", "70"],
      answer: "153",
      explanation: "John 21:11. Simon Peter climbed aboard and dragged the net ashore. It was full of large fish, 153, but the net was not torn."
    },
    {
      question: "What was the name of the prophet who rebuked King David for his sin with Bathsheba?",
      options: ["Nathan", "Samuel", "Elijah", "Gad"],
      answer: "Nathan",
      explanation: "2 Samuel 12. Nathan used a parable about a rich man stealing a poor man's ewe lamb to convict David, saying, 'You are the man!'"
    },
    {
      question: "Which book of the Old Testament contains the famous quote: 'There is a time for everything'?",
      options: ["Ecclesiastes", "Proverbs", "Psalms", "Song of Solomon"],
      answer: "Ecclesiastes",
      explanation: "Ecclesiastes 3:1. 'There is a time for everything, and a season for every activity under the heavens.'"
    },
    {
      question: "Who was the husband of the prophetess Deborah?",
      options: ["Lappidoth", "Barak", "Heber", "Sisera"],
      answer: "Lappidoth",
      explanation: "Judges 4:4. Deborah, a prophetess, the wife of Lappidoth, was leading Israel at that time."
    },
    {
      question: "What Roman centurion was the first Gentile convert to Christianity?",
      options: ["Cornelius", "Julius", "Longinus", "Marcus"],
      answer: "Cornelius",
      explanation: "Acts 10. Cornelius was a devout, God-fearing centurion who was commanded by an angel to summon Peter to preach to his household."
    },
    {
      question: "What prophet had a vision of a wheel within a wheel?",
      options: ["Ezekiel", "Isaiah", "Daniel", "Zechariah"],
      answer: "Ezekiel",
      explanation: "Ezekiel 1:16. Ezekiel saw four wheels, and their appearance and structure was like a wheel intersecting a wheel."
    },
    {
      question: "What animal spoke to the prophet Balaam?",
      options: ["A donkey", "A serpent", "A sheep", "A camel"],
      answer: "A donkey",
      explanation: "Numbers 22:28. The Lord opened the donkey's mouth, and she said to Balaam, 'What have I done to you to make you beat me these three times?'"
    },
    {
      question: "Who was the father of Samuel?",
      options: ["Elkanah", "Eli", "Jesse", "Zechariah"],
      answer: "Elkanah",
      explanation: "1 Samuel 1:1-2. Elkanah of Ramathaim-Zophim was the husband of Hannah and Peninnah, and father of Samuel."
    },
    {
      question: "In what city were the believers first called 'Christians'?",
      options: ["Antioch", "Jerusalem", "Damascus", "Ephesus"],
      answer: "Antioch",
      explanation: "Acts 11:26. Barnabas and Saul met with the church in Antioch, and the disciples were called Christians first there."
    },
    {
      question: "Which OT book tells the story of a prophet commanded to marry an unfaithful woman?",
      options: ["Hosea", "Amos", "Joel", "Micah"],
      answer: "Hosea",
      explanation: "Hosea 1:2. The Lord said to Hosea, 'Go, marry a promiscuous wife... because the land is guilty of the vilest adultery in departing from the Lord.'"
    },
    {
      question: "How many cities of refuge did Moses and Joshua set apart for people who accidentally killed someone?",
      options: ["6", "3", "12", "7"],
      answer: "6",
      explanation: "Numbers 35 / Joshua 20. Six cities of refuge were established, three on each side of the Jordan River, to shelter those guilty of manslaughter."
    },
    {
      question: "Which of the NT epistles has the main theme of Jesus as our high priest in the order of Melchizedek?",
      options: ["Hebrews", "Romans", "Galatians", "Colossians"],
      answer: "Hebrews",
      explanation: "The Book of Hebrews argues extensively for the superiority of Christ, portraying Him as our eternal High Priest in the order of Melchizedek."
    },
    {
      question: "Which of the four Gospels is structurally and stylistically different from the synoptic Gospels?",
      options: ["John", "Matthew", "Mark", "Luke"],
      answer: "John",
      explanation: "John is highly theological and distinct, focusing on Jesus' divine identity, whereas Matthew, Mark, and Luke are called Synoptic Gospels."
    },
    {
      question: "How many sons did Job lose in a storm at the beginning of the Book of Job?",
      options: ["7 sons", "3 sons", "10 sons", "5 sons"],
      answer: "7 sons",
      explanation: "Job 1:2. Job originally had seven sons and three daughters, all of whom died when a strong wind collapsed the house they were in."
    },
    {
      question: "What is the name of the valley where David fought Goliath?",
      options: ["Valley of Elah", "Valley of Jezreel", "Valley of Kidron", "Valley of Hinom"],
      answer: "Valley of Elah",
      explanation: "1 Samuel 17:2. Saul and the Israelites assembled and camped in the Valley of Elah and drew up their battle line to meet the Philistines."
    }
  ],
  expert: [
    {
      question: "Who was the left-handed judge who assassinated the obese King Eglon of Moab?",
      options: ["Ehud", "Gideon", "Othniel", "Samson"],
      answer: "Ehud",
      explanation: "Judges 3. Ehud crafted a double-edged sword, bound it to his right thigh, gained a private audience with the obese King Eglon, and assassinated him."
    },
    {
      question: "In the Book of Revelation, what is the name of the star that fell into the waters, making them bitter?",
      options: ["Absinthe", "Wormwood", "Marah", "Lucifer"],
      answer: "Wormwood",
      explanation: "Revelation 8:11. The name of the star is Wormwood. A third of the waters turned bitter, and many people died from the water."
    },
    {
      question: "Who was the father of the twelve tribes of Israel's first king, Saul?",
      options: ["Kish", "Ner", "Abiel", "Zeror"],
      answer: "Kish",
      explanation: "1 Samuel 9:1. Kish, a wealthy Benjamite, was the father of Saul."
    },
    {
      question: "What was the name of the goldsmith who helped Nehemiah rebuild the gates of Jerusalem?",
      options: ["Uzziel", "Malchijah", "Hananiah", "Zabud"],
      answer: "Uzziel",
      explanation: "Nehemiah 3:8. Uzziel son of Harhaiah, one of the goldsmiths, helped repair the next section of Jerusalem's wall."
    },
    {
      question: "Who is the only female judge mentioned in the Book of Judges?",
      options: ["Deborah", "Jael", "Athaliah", "Huldah"],
      answer: "Deborah",
      explanation: "Judges 4:4. Deborah, a prophetess, the wife of Lappidoth, was leading Israel at that time."
    },
    {
      question: "Which of the Minor Prophets contains the shortest book in the Old Testament with only 21 verses?",
      options: ["Obadiah", "Haggai", "Habakkuk", "Joel"],
      answer: "Obadiah",
      explanation: "The Book of Obadiah has only one chapter with 21 verses, focusing on the judgment of Edom."
    },
    {
      question: "What was the name of the high priest who was killed by King Saul along with 85 other priests at Nob?",
      options: ["Ahimelech", "Abiathar", "Phinehas", "Zadok"],
      answer: "Ahimelech",
      explanation: "1 Samuel 22. Saul ordered Doeg the Edomite to slaughter Ahimelech and the priests of Nob for helping David."
    },
    {
      question: "Which king of Israel dug the famous water tunnel in Jerusalem to prepare for Assyrian siege?",
      options: ["Hezekiah", "Josiah", "Uzziah", "Manasseh"],
      answer: "Hezekiah",
      explanation: "2 Kings 20:20. Hezekiah dug the pool and the tunnel, bringing water into the city of Jerusalem during Assyrian threat."
    },
    {
      question: "Who was the father of the prophet Elisha?",
      options: ["Shaphat", "Nimshi", "Jehoshaphat", "Kish"],
      answer: "Shaphat",
      explanation: "1 Kings 19:16. God told Elijah to anoint Elisha son of Shaphat from Abel Meholah to succeed him as prophet."
    },
    {
      question: "What was the name of the scribe who read the Law of Moses to the returned exiles?",
      options: ["Ezra", "Nehemiah", "Haggai", "Zerubbabel"],
      answer: "Ezra",
      explanation: "Nehemiah 8. Ezra the priest and scribe brought the Law before the assembly and read it aloud from morning until midday."
    },
    {
      question: "Which king of Judah was struck with leprosy for arrogantly burning incense in the temple?",
      options: ["Uzziah", "Hezekiah", "Josiah", "Ahaz"],
      answer: "Uzziah",
      explanation: "2 Chronicles 26. King Uzziah became proud and entered the temple to burn incense, which only priests were allowed to do. He immediately broke out in leprosy."
    },
    {
      question: "In the genealogy of Jesus in Matthew 1, how many generations are listed from Abraham to David?",
      options: ["14", "12", "7", "40"],
      answer: "14",
      explanation: "Matthew 1:17. 'Thus there were fourteen generations in all from Abraham to David, fourteen from David to the exile...'"
    },
    {
      question: "What was the name of the king of Sodom during the time of Abraham?",
      options: ["Bera", "Birsha", "Shinab", "Shemeber"],
      answer: "Bera",
      explanation: "Genesis 14:2. These kings went to war against Bera king of Sodom, Birsha king of Gomorrah..."
    },
    {
      question: "Who was the father of Hermas, mentioned in Romans 16?",
      options: ["Not mentioned", "Rufus", "Phlegon", "Hermes"],
      answer: "Not mentioned",
      explanation: "Romans 16:14. Paul greets 'Asyncritus, Phlegon, Hermes, Patrobas, Hermas and the other brothers,' but their father is not specified."
    },
    {
      question: "What was the name of the goddess whose temple in Ephesus was the center of an uproar against Paul?",
      options: ["Artemis", "Athena", "Diana", "Aphrodite"],
      answer: "Artemis",
      explanation: "Acts 19:28. The silversmiths shouted, 'Great is Artemis of the Ephesians!' because Paul was turning people away from idols."
    },
    {
      question: "Who was the priest of Midian, also known as Reuel, who was Moses' father-in-law?",
      options: ["Jethro", "Hobab", "Balaam", "Laban"],
      answer: "Jethro",
      explanation: "Exodus 3:1. Jethro, also called Reuel in Exodus 2, was the father of Zipporah and father-in-law of Moses."
    },
    {
      question: "Which king of Israel committed suicide by burning down his palace around himself?",
      options: ["Zimri", "Omri", "Jehu", "Ahab"],
      answer: "Zimri",
      explanation: "1 Kings 16:18. When Zimri saw the city was taken, he went into the citadel of the royal palace and set the palace on fire around him."
    },
    {
      question: "What was the name of the prophet Isaiah's father?",
      options: ["Amoz", "Amos", "Hilkish", "Buzi"],
      answer: "Amoz",
      explanation: "Isaiah 1:1. The vision concerning Judah and Jerusalem that Isaiah son of Amoz saw..."
    },
    {
      question: "Who was the third son of Jacob and Leah, whose descendants became the priestly tribe?",
      options: ["Levi", "Simeon", "Judah", "Reuben"],
      answer: "Levi",
      explanation: "Genesis 29:34. Leah conceived again, saying, 'Now at last my husband will become attached to me, because I have borne him three sons.' So he was named Levi."
    },
    {
      question: "What was the name of the city where the Ark of the Covenant was kept before it was captured by Philistines?",
      options: ["Shiloh", "Bethel", "Jerusalem", "Gibeon"],
      answer: "Shiloh",
      explanation: "1 Samuel 4. The Ark of God was moved from Shiloh to the battle lines, where the Philistines captured it."
    },
    {
      question: "What was the name of the wife of Zechariah, John the Baptist's mother?",
      options: ["Elizabeth", "Mary", "Hannah", "Martha"],
      answer: "Elizabeth",
      explanation: "Luke 1:5. Zechariah's wife Elizabeth was also a descendant of Aaron, a righteous relative of Mary."
    },
    {
      question: "In the Book of Job, which friend was the youngest and spoke last?",
      options: ["Elihu", "Eliphaz", "Bildad", "Zophar"],
      answer: "Elihu",
      explanation: "Job 32. Elihu son of Barakel the Buzite waited to speak because the others were older than he."
    },
    {
      question: "What was the name of the sorcerer in Paphos who was struck blind by Paul?",
      options: ["Elymas", "Simon", "Hermes", "Theudas"],
      answer: "Elymas",
      explanation: "Acts 13:8. Elymas the sorcerer (for that is what his name means) opposed them and tried to turn the proconsul from the faith."
    },
    {
      question: "Which city's church does Jesus praise for having 'little strength' yet keeping His word?",
      options: ["Philadelphia", "Smyrna", "Pergamum", "Thyatira"],
      answer: "Philadelphia",
      explanation: "Revelation 3:8. 'I know that you have little strength, yet you have kept my word and have not denied my name.'"
    },
    {
      question: "What was the name of the servant whose ear Peter cut off during Jesus' arrest?",
      options: ["Malchus", "Marcus", "Julius", "Eleazar"],
      answer: "Malchus",
      explanation: "John 18:10. Simon Peter, who had a sword, drew it and struck the high priest's servant, cutting off his right ear. The servant's name was Malchus."
    },
    {
      question: "Who was the father of the prophet Zephaniah?",
      options: ["Cushi", "Gedaliah", "Amariah", "Hezekiah"],
      answer: "Cushi",
      explanation: "Zephaniah 1:1. The word of the Lord that came to Zephaniah son of Cushi, the son of Gedaliah..."
    },
    {
      question: "In the Book of Esther, who was Esther's cousin and guardian?",
      options: ["Mordecai", "Haman", "Memucan", "Hegai"],
      answer: "Mordecai",
      explanation: "Esther 2:7. Mordecai had a cousin named Hadassah, whom he had brought up because she had neither father nor mother. She was also known as Esther."
    },
    {
      question: "What was the name of the ruler of the synagogue whose daughter Jesus raised from the dead?",
      options: ["Jairus", "Nicodemus", "Crispus", "Sosthenes"],
      answer: "Jairus",
      explanation: "Mark 5:22. One of the synagogue leaders, named Jairus, came, and when he saw Jesus, he fell at his feet."
    },
    {
      question: "Which book of the Bible contains the prophetic vision of the four beasts rising from the sea?",
      options: ["Daniel", "Ezekiel", "Revelation", "Zechariah"],
      answer: "Daniel",
      explanation: "Daniel 7. Daniel saw in his vision four great beasts, each different from the others, coming up out of the sea."
    },
    {
      question: "Who was the father of the prophet Isaiah?",
      options: ["Amoz", "Amos", "Hilkiah", "Buzi"],
      answer: "Amoz",
      explanation: "Isaiah 1:1. The vision of Isaiah son of Amoz, which he saw concerning Judah and Jerusalem."
    },
    {
      question: "Which prophet ran a race and outran Ahab's chariot to Jezreel?",
      options: ["Elijah", "Elisha", "Micaiah", "Obadiah"],
      answer: "Elijah",
      explanation: "1 Kings 18:46. The power of the Lord came on Elijah and, tucking his cloak into his belt, he ran ahead of Ahab all the way to Jezreel."
    },
    {
      question: "What was the name of the deity whose temple was destroyed by Samson when he collapsed the pillars?",
      options: ["Dagon", "Baal", "Ashtoreth", "Molech"],
      answer: "Dagon",
      explanation: "Judges 16:23. The Philistine rulers assembled to offer a great sacrifice to Dagon their god and to celebrate."
    },
    {
      question: "What was the name of the place where Moses struck a rock and water gushed out, also meaning 'testing'?",
      options: ["Massah", "Marah", "Elim", "Rephidim"],
      answer: "Massah",
      explanation: "Exodus 17:7. He called the place Massah (testing) and Meribah (quarreling) because the Israelites quarreled and tested the Lord."
    },
    {
      question: "Which of King David's commanders murdered Absalom in direct violation of David's orders?",
      options: ["Joab", "Abner", "Amasa", "Benaiah"],
      answer: "Joab",
      explanation: "2 Samuel 18:14. Joab took three javelins in his hand and plunged them into Absalom's heart while Absalom was still alive in the oak."
    },
    {
      question: "Who was the father of Caleb, who with Joshua gave a positive report of Canaan?",
      options: ["Jephunneh", "Nun", "Hezron", "Kenaz"],
      answer: "Jephunneh",
      explanation: "Numbers 13:6. From the tribe of Judah, Caleb son of Jephunneh was selected to spy out the land."
    },
    {
      question: "What was the name of the town where Elkanah and Hannah lived?",
      options: ["Ramah", "Shiloh", "Hebron", "Gibeah"],
      answer: "Ramah",
      explanation: "1 Samuel 1:19. They got up early the next morning and worshiped the Lord, then went back to their home at Ramah."
    },
    {
      question: "Who was the high priest who helped Ezra and Nehemiah rebuild the walls of Jerusalem?",
      options: ["Eliashib", "Jeshua", "Joiada", "Zadok"],
      answer: "Eliashib",
      explanation: "Nehemiah 3:1. Eliashib the high priest and his fellow priests went to work and rebuilt the Sheep Gate."
    },
    {
      question: "What was the name of the city where the Apostle Paul was stoned and left for dead, yet survived?",
      options: ["Lystra", "Iconium", "Derbe", "Antioch"],
      answer: "Lystra",
      explanation: "Acts 14:19. Some Jews from Antioch and Iconium came and won the crowd over. They stoned Paul and dragged him outside the city, thinking he was dead."
    },
    {
      question: "Which King of Israel was referred to as 'the son of Nimshi', famous for his furious chariot driving?",
      options: ["Jehu", "Ahab", "Jehoahaz", "Joram"],
      answer: "Jehu",
      explanation: "2 Kings 9:20. The lookout reported, 'The driving is like that of Jehu son of Nimshi—he drives like a maniac.'"
    },
    {
      question: "What was the name of the gate of the temple where Peter healed the lame beggar?",
      options: ["Beautiful", "East", "Sheep", "Golden"],
      answer: "Beautiful",
      explanation: "Acts 3:2. A man lame from birth was being carried to the temple gate called Beautiful, where he was put every day to beg."
    },
    {
      question: "In the Book of Judges, who was the father of Gideon?",
      options: ["Joash", "Abiezer", "Jerubbaal", "Jephthah"],
      answer: "Joash",
      explanation: "Judges 6:11. The angel of the Lord sat under the oak in Ophrah that belonged to Joash the Abiezrite, where his son Gideon was threshing wheat."
    },
    {
      question: "Who was the first person to see the risen Jesus on Easter morning?",
      options: ["Mary Magdalene", "Peter", "John", "Mary the mother of Jesus"],
      answer: "Mary Magdalene",
      explanation: "John 20:11-18 / Mark 16:9. When Jesus rose early on the first day of the week, He appeared first to Mary Magdalene, out of whom He had driven seven demons."
    },
    {
      question: "What was the name of Abraham's father who died in Haran?",
      options: ["Terah", "Nahor", "Haran", "Milcah"],
      answer: "Terah",
      explanation: "Genesis 11:32. Terah lived 205 years, and he died in Haran on his journey towards Canaan."
    },
    {
      question: "What was the name of the king of Salem who brought bread and wine to Abram?",
      options: ["Melchizedek", "Abimelech", "Chedorlaomer", "Bera"],
      answer: "Melchizedek",
      explanation: "Genesis 14:18. Melchizedek king of Salem brought out bread and wine. He was priest of God Most High."
    },
    {
      question: "In the Book of Revelation, which church is criticized for tolerating a woman named Jezebel?",
      options: ["Thyatira", "Pergamum", "Sardis", "Laodicea"],
      answer: "Thyatira",
      explanation: "Revelation 2:20. 'Nevertheless, I have this against you: You tolerate that woman Jezebel, who calls herself a prophetess...'"
    },
    {
      question: "Which Old Testament book contains the vision of the valley of dry bones?",
      options: ["Ezekiel", "Daniel", "Isaiah", "Jeremiah"],
      answer: "Ezekiel",
      explanation: "Ezekiel 37 details the dry bones taking on flesh and breath, symbolizing the revival and restoration of the house of Israel."
    },
    {
      question: "What was the name of the sorceress Saul consulted at Endor?",
      options: ["The Medium of Endor", "Jezebel", "Athaliah", "No name recorded"],
      answer: "No name recorded",
      explanation: "1 Samuel 28. She is referred to only as 'a medium at Endor' or 'a woman who is a medium' in biblical texts."
    },
    {
      question: "What was the name of Moses' wife whom he met at a well in Midian?",
      options: ["Zipporah", "Miriam", "Rachel", "Asenath"],
      answer: "Zipporah",
      explanation: "Exodus 2:21. Reuel (Jethro) gave his daughter Zipporah to Moses in marriage after Moses rescued his daughters at the well."
    },
    {
      question: "What was the name of the left-handed judge of Israel who assassinated Eglon?",
      options: ["Ehud", "Othniel", "Shamgar", "Gideon"],
      answer: "Ehud",
      explanation: "Judges 3. Ehud, a left-handed Benjamite, delivered Israel from Moab by assassinating the heavy King Eglon with a hidden dagger."
    },
    {
      question: "Who was the father of the twelve sons who became the patriarchs of Israel?",
      options: ["Jacob", "Isaac", "Abraham", "Joseph"],
      answer: "Jacob",
      explanation: "Genesis 35:22. Jacob had twelve sons who became the heads of the twelve tribes of Israel."
    },
    {
      question: "Who was the king of Judah who instituted massive religious reforms after finding the Book of the Law?",
      options: ["Josiah", "Hezekiah", "Uzziah", "Jehoshaphat"],
      answer: "Josiah",
      explanation: "2 Kings 22-23. Josiah ordered the temple repaired, where the Book of the Law was discovered, prompting a nationwide revival."
    },
    {
      question: "What prophet was taken up into heaven in a chariot of fire and a whirlwind?",
      options: ["Elijah", "Elisha", "Ezekiel", "Enoch"],
      answer: "Elijah",
      explanation: "2 Kings 2:11. Elijah and Elisha were walking together when a chariot of fire separated them, and Elijah ascended in a whirlwind."
    },
    {
      question: "Who was the first person to see Jesus after His resurrection?",
      options: ["Mary Magdalene", "Simon Peter", "John", "His Mother Mary"],
      answer: "Mary Magdalene",
      explanation: "Mark 16:9 / John 20. Mary Magdalene stayed at the tomb weeping and was the first to recognize the risen Lord."
    },
    {
      question: "How many elders sat on thrones surrounding the throne of God in Revelation 4?",
      options: ["24", "12", "7", "144"],
      answer: "24",
      explanation: "Revelation 4:4. Surrounding the throne were twenty-four other thrones, and seated on them were twenty-four elders dressed in white."
    },
    {
      question: "What was the name of the high priest who anointed King Solomon?",
      options: ["Zadok", "Abiathar", "Ahimelech", "Hilkiah"],
      answer: "Zadok",
      explanation: "1 Kings 1:39. Zadok the priest took the horn of oil from the sacred tent and anointed Solomon."
    },
    {
      question: "Which of the Minor Prophets has a name that translates to 'My Messenger'?",
      options: ["Malachi", "Haggai", "Zechariah", "Micah"],
      answer: "Malachi",
      explanation: "The name Malachi literally means 'my messenger' in Hebrew, matching his prophetic role in preparing the way of the Lord."
    },
    {
      question: "What was the name of the valley where Joshua commanded the sun and moon to stand still?",
      options: ["Valley of Aijalon", "Valley of Jezreel", "Valley of Elah", "Valley of Eshcol"],
      answer: "Valley of Aijalon",
      explanation: "Joshua 10:12. Joshua prayed: 'Sun, stand still over Gibeon, and you, moon, over the Valley of Aijalon.'"
    },
    {
      question: "Who was the Roman procurator of Judea before whom Paul pleaded his case, who was famous for his trembling?",
      options: ["Felix", "Festus", "Gallio", "Lysias"],
      answer: "Felix",
      explanation: "Acts 24:25. As Paul talked about righteousness, self-control and judgment, Felix was terrified (trembled) and dismissed him."
    },
    {
      question: "What was the name of Jacob's grandfather?",
      options: ["Abraham", "Terah", "Isaac", "Nahor"],
      answer: "Abraham",
      explanation: "Abraham was the father of Isaac, who was the father of Jacob, making Abraham Jacob's grandfather."
    },
    {
      question: "Who was the mother of Solomon?",
      options: ["Bathsheba", "Maacah", "Haggith", "Abital"],
      answer: "Bathsheba",
      explanation: "2 Samuel 12:24. David comforted his wife Bathsheba, and she gave birth to a son, and they named him Solomon."
    },
    {
      question: "Which Old Testament book contains the prophecy: 'Look, the virgin shall conceive and bear a son'?",
      options: ["Isaiah", "Jeremiah", "Micah", "Daniel"],
      answer: "Isaiah",
      explanation: "Isaiah 7:14. 'Therefore the Lord himself will give you a sign: The virgin will conceive and give birth to a son, and will call him Immanuel.'"
    },
    {
      question: "What was the name of the city where the believers were first called Christians?",
      options: ["Antioch", "Damascus", "Jerusalem", "Rome"],
      answer: "Antioch",
      explanation: "Acts 11:26. Barnabas and Saul spent a year teaching in Antioch, where the disciples were first called Christians."
    },
    {
      question: "How many chapters are in the Book of Psalms?",
      options: ["150", "119", "100", "160"],
      answer: "150",
      explanation: "The Book of Psalms contains exactly 150 individual poetic chapters or songs."
    },
    {
      question: "Who was the third son of Adam and Eve, born after Abel's death?",
      options: ["Seth", "Enoch", "Jared", "Lamech"],
      answer: "Seth",
      explanation: "Genesis 4:25. Eve gave birth to a son and named him Seth, saying, 'God has granted me another child in place of Abel.'"
    },
    {
      question: "What was the name of the servant whose ear Peter cut off at the Garden of Gethsemane?",
      options: ["Malchus", "Marcus", "Stephen", "Barnabas"],
      answer: "Malchus",
      explanation: "John 18:10. Simon Peter drew his sword and cut off the right ear of Malchus, the servant of the high priest."
    },
    {
      question: "What prophet was fed bread and cake by an angel while sleeping under a broom bush?",
      options: ["Elijah", "Elisha", "Jeremiah", "Hosea"],
      answer: "Elijah",
      explanation: "1 Kings 19:5. Elijah lay down under the bush and fell asleep, when an angel touched him and said, 'Get up and eat.'"
    },
    {
      question: "Who was the mother of Samuel, the great judge and prophet?",
      options: ["Hannah", "Peninnah", "Elizabeth", "Rachel"],
      answer: "Hannah",
      explanation: "1 Samuel 1. Hannah prayed intensely in the temple for a child, and God answered by granting her Samuel."
    },
    {
      question: "What was the name of the king of Persia who issued the decree allowing the Jews to rebuild Jerusalem's temple?",
      options: ["Cyrus", "Darius", "Artaxerxes", "Xerxes"],
      answer: "Cyrus",
      explanation: "Ezra 1:1. In the first year of Cyrus king of Persia, the Lord moved his heart to make a written proclamation allowing the Jews to return."
    },
    {
      question: "What island did the Apostle Paul shipwreck on while traveling to Rome?",
      options: ["Malta", "Crete", "Cyprus", "Sicily"],
      answer: "Malta",
      explanation: "Acts 28:1. Once safely on shore, we found out that the island was called Malta, where the islanders showed unusual kindness."
    },
    {
      question: "Who was the father of John the Baptist?",
      options: ["Zechariah", "Joseph", "Simeon", "Aeneas"],
      answer: "Zechariah",
      explanation: "Luke 1. Zechariah, a priest of the division of Abijah, was John the Baptist's father."
    },
    {
      question: "How many chapters are in the Book of Revelation?",
      options: ["22", "12", "24", "40"],
      answer: "22",
      explanation: "The Book of Revelation contains exactly 22 chapters, detailing the ultimate return of Christ and the new creation."
    },
    {
      question: "Who was the wife of Isaac, whom Eliezer found at a well in Nahor?",
      options: ["Rebekah", "Rachel", "Leah", "Keturah"],
      answer: "Rebekah",
      explanation: "Genesis 24. Rebekah showed hospitality by drawing water for Eliezer's camels, proving she was God's chosen wife for Isaac."
    },
    {
      question: "Which of Jacob's twelve sons was his firstborn?",
      options: ["Reuben", "Simeon", "Levi", "Judah"],
      answer: "Reuben",
      explanation: "Genesis 49:3. Jacob addresses Reuben: 'Reuben, you are my firstborn, my might, the first sign of my strength.'"
    },
    {
      question: "What city is prophesied to fall in the Book of Nahum?",
      options: ["Nineveh", "Babylon", "Sodom", "Tyre"],
      answer: "Nineveh",
      explanation: "The entire Book of Nahum is a prophecy detailing the destruction and fall of Nineveh, the capital of Assyria."
    },
    {
      question: "Who was the husband of the prophetess Deborah, who judged Israel?",
      options: ["Lappidoth", "Barak", "Sisera", "Heber"],
      answer: "Lappidoth",
      explanation: "Judges 4:4. Deborah, a prophetess, the wife of Lappidoth, was leading Israel at that time."
    },
    {
      question: "What is the name of the final book of the Old Testament?",
      options: ["Malachi", "Zechariah", "Haggai", "Nehemiah"],
      answer: "Malachi",
      explanation: "Malachi is the last of the 39 books in the Old Testament, concluding with prophecies of Elijah's return."
    },
    {
      question: "In what sea did the great fish swallow Jonah?",
      options: ["Mediterranean Sea", "Red Sea", "Sea of Galilee", "Dead Sea"],
      answer: "Mediterranean Sea",
      explanation: "Jonah was sailing from Joppa to Tarshish, which is on the Mediterranean Sea, when the storm and the fish intercepted him."
    },
    {
      question: "Who was the priest who anointed King David to succeed Saul?",
      options: ["Samuel", "Nathan", "Zadok", "Eli"],
      answer: "Samuel",
      explanation: "1 Samuel 16. Samuel took the horn of oil and anointed David in the presence of his brothers."
    },
    {
      question: "Which tribe of Israel did the Apostle Paul belong to?",
      options: ["Benjamin", "Judah", "Levi", "Ephraim"],
      answer: "Benjamin",
      explanation: "Philippians 3:5. Paul describes himself as: 'circumcised on the eighth day, of the people of Israel, of the tribe of Benjamin...'"
    },
    {
      question: "How many chapters are in the Gospel of Matthew?",
      options: ["28", "24", "16", "21"],
      answer: "28",
      explanation: "The Gospel of Matthew contains exactly 28 chapters, making it the longest of the four Gospels."
    },
    {
      question: "Who was the father of Abraham, Nahor, and Haran?",
      options: ["Terah", "Nahor", "Eber", "Peleg"],
      answer: "Terah",
      explanation: "Genesis 11:26. After Terah had lived 70 years, he became the father of Abram, Nahor and Haran."
    },
    {
      question: "Which of the seven churches in Revelation is described as being dead despite having a reputation of being alive?",
      options: ["Sardis", "Ephesus", "Pergamum", "Laodicea"],
      answer: "Sardis",
      explanation: "Revelation 3:1. 'I know your deeds; you have a reputation of being alive, but you are dead. Wake up!'"
    },
    {
      question: "What was the name of the king of Moab who hired Balaam to curse Israel?",
      options: ["Balak", "Eglon", "Mesha", "Sihon"],
      answer: "Balak",
      explanation: "Numbers 22:4. Balak son of Zippor, who was king of Moab at that time, sent messengers to summon Balaam."
    },
    {
      question: "In the Book of Daniel, what was Daniel's Babylonian name?",
      options: ["Belteshazzar", "Shadrach", "Meshach", "Abednego"],
      answer: "Belteshazzar",
      explanation: "Daniel 1:7. The chief official gave them new names: to Daniel, the name Belteshazzar; to Hananiah, Shadrach..."
    },
    {
      question: "What was the name of the servant girl who went to the door when Peter knocked after escaping prison in Acts 12?",
      options: ["Rhoda", "Tabitha", "Priscilla", "Damaris"],
      answer: "Rhoda",
      explanation: "Acts 12:13. Peter knocked at the outer entrance, and a servant named Rhoda came to answer the door and was so overjoyed she forgot to open it."
    },
    {
      question: "Which book of the Old Testament contains the story of a prophet thrown into a pit of sinking mud?",
      options: ["Jeremiah", "Isaiah", "Ezekiel", "Daniel"],
      answer: "Jeremiah",
      explanation: "Jeremiah 38. They lowered Jeremiah by ropes into a cistern that had no water in it, only mud, and Jeremiah sank into the mud."
    },
    {
      question: "What was the name of the father of Haman, the antagonist in the Book of Esther?",
      options: ["Hammedatha", "Mordecai", "Ahasuerus", "Harbona"],
      answer: "Hammedatha",
      explanation: "Esther 3:1. King Ahasuerus honored Haman son of Hammedatha, the Agagite, elevating him above all other nobles."
    },
    {
      question: "Who was the father of Abraham's wife Sarah, making her his half-sister?",
      options: ["Terah", "Haran", "Nahor", "Lot"],
      answer: "Terah",
      explanation: "Genesis 20:12. Abraham admits, 'Besides, she really is my sister, the daughter of my father, though not of my mother.'"
    },
    {
      question: "Which prophet had a vision of a flying scroll?",
      options: ["Zechariah", "Haggai", "Ezekiel", "Daniel"],
      answer: "Zechariah",
      explanation: "Zechariah 5:1. 'I looked again, and there before me was a flying scroll!' representing a curse over the face of the whole land."
    }
  ]
};

module.exports = { INITIAL_TRIVIA };
