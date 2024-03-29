import FallenImage from "./assets/images/FallenImg.jpeg"
// import MathematicianImage from "./assets/images/MathematicianImg.jpeg"
import Image1 from "./assets/gallery/AmericanGothic.jpg"
import Image2 from "./assets/gallery/TheSchoolOfAthens.jpg"
import Image3 from "./assets/gallery/Nighthawks.jpg"
import Image4 from "./assets/gallery/TheDeathOfSocrates.jpg"
import Image5 from "./assets/gallery/GirlWithAPearlEarring.jpg"
import Image6 from "./assets/gallery/TheVanGogh.jpg"
import Image7 from "./assets/gallery/StarryNight.jpg"
import Image8 from "./assets/gallery/EchoAndNarcissus.jpg"
import Image9 from "./assets/gallery/ThePersistenceOfMemory.jpg"
const logotext = "Ephemenral";
const meta = {
    title: "Ephemeral",
    description: "I'm Yash Darji, I have the delusion of exitence",
};

const introdata = {
    title: "I'm Yash",
    animated: {
        first: "Physics",
        second: "Rockets",
        third: "Computers",
    },
    description: "Just a bag of particles finding the meaning of it all",
    your_img_url: FallenImage,
};

const dataabout = {
    title: "Seeker",
    aboutme: "Never seemed to articulate myself, So rather I would leave you with this quatrain,",
    quatrain:`
Within the quiet echo of my days, a novice on life's stage,
Whispers weave a tale, a gentle prelude to engage.
Haven't scripted grand narratives or soared high,
Yet, in simplicity's embrace, I offer a humble 'hi.'
`
};


const poetryQuotes = [
    '“It was at that age, that poetry came in search of me.” —Pablo Neruda',
    '“Poetry is a way of taking life by the throat.” —Robert Frost',
    '“Poetry is an echo, asking a shadow to dance.” —Carl Sandburg',
    '“Poetry is language at its most distilled and most powerful.” —Rita Dove'
]

const poems = [
    {
        title: "Fifth Philospher's Song",
        author: 'Aldous Huxley',
        no:1,
        aboutAuthor: 'https://en.wikipedia.org/wiki/Aldous_Huxley',
        poem: `
A million million spermatozoa
All of them alive;
Out of their cataclysm but one poor Noah
Dare hope to survive.
    
And among that billion minus one
Might have chanced to be
Shakespeare, another Newton, a new Donne—
But the One was Me.
    
Shame to have ousted your betters thus,
Taking ark while the others remained outside!
Better for all of us, froward Homunculus,
If you'd quietly died!
`
    },
    {
        title: "हवन",
        author: "श्रीकांत वर्मा",
        no:2,
        aboutAuthor: 'https://en.wikipedia.org/wiki/Shrikant_Verma',
        poem:`
चाहता तो बच सकता था 
मगर कैसे बच सकता था 
जो बचेगा 
कैसे रचेगा 

पहले मैं झुलसा 
फिर धधका 
चिटखने लगा 

कराह सकता था 
मगर कैसे कराह सकता था 
जो कराहेगा 
कैसे निबाहेगा 

न यह शहादत थी 
न यह उत्सर्ग था 
न यह आत्मपीड़न था 
न यह सज़ा थी 
तब 
क्या था यह 

किसी के मत्थे मढ़ सकता था 
मगर कैसे मढ़ सकता था 
जो मढ़ेगा कैसे गढ़ेगा। 
        `
    },
    {
        title: "Sonet 141",
        author: "Willam Shakespeare",
        no:3,
        aboutAuthor: 'https://en.wikipedia.org/wiki/William_Shakespeare',
        poem:`
In faith, I do not love thee with mine eyes,
For they in thee a thousand errors note;
But 'tis my heart that loves what they despise,
Who, in despite of view, is pleased to dote;
Nor are mine ears with thy tongue's tune delighted,
Nor tender feeling, to base touches prone,
Nor taste, nor smell, desire to be invited
To any sensual feast with thee alone:
But my five wits nor my five senses can
Dissuade one foolish heart from serving thee,
Who leaves unswayed the likeness of a man,
Thy proud heart's slave and vassal wretch to be.
    Only my plague thus far I count my gain,
    That she that makes me sin awards me pain.
        `
    },
    {
        title: "किताबें",
        author: "गुलज़ार",
        no:4,
        aboutAuthor: 'https://en.wikipedia.org/wiki/Gulzar',
        poem:`
किताबें झांकती हैं बंद अलमारी के शीशों से
बड़ी हसरत से तकती हैं
महीनों अब मुलाक़ातें नहीं होतीं
जो शामें उन की सोहबत में कटा करती थीं, अब अक्सर
गुज़र जाती हैं कम्पयूटर के पर्दों पर
बड़ी बेचैन रहती हैं किताबें
उन्हें अब नींद में चलने की आदत हो गई है
बड़ी हसरत से तकती हैं
जो क़द्रें वो सुनाती थीं
कि जिन के सेल कभी मरते नहीं थे
वो क़द्रें अब नज़र आती नहीं घर में
जो रिश्ते वो सुनाती थीं
वो सारे उधड़े उधड़े हैं

कोई सफ़्हा पलटता हूं तो इक सिसकी निकलती है
कई लफ़्ज़ों के मानी गिर पड़े हैं
बिना पत्तों के सूखे तुंड लगते हैं वो सब अल्फ़ाज़
जिन पर अब कोई मानी नहीं उगते
बहुत सी इस्तेलाहें हैं

जो मिट्टी के सकोरों की तरह बिखरी पड़ी हैं
गिलासों ने उन्हें मतरूक कर डाला
ज़बां पर ज़ाइक़ा आता था जो सफ़्हे पलटने का
अब उंगली क्लिक करने से बस इक
झपकी गुज़रती है
बहुत कुछ तह-ब-तह खुलता चला जाता है पर्दे पर

किताबों से जो ज़ाती राब्ता था कट गया है
कभी सीने पे रख के लेट जाते थे
कभी गोदी में लेते थे
कभी घुटनों को अपने रेहल की सूरत बना कर
नीम सज्दे में पढ़ा करते थे छूते थे जबीं से

वो सारा इल्म तो मिलता रहेगा आइंदा भी
मगर वो जो किताबों में मिला करते थे सूखे फूल और
महके हुए रुकए
किताबें माँगने गिरने उठाने के बहाने रिश्ते बनते थे
उन का क्या होगा
वो शायद अब नहीं होंगे!
        `
    },
]
const paintings = [{
        img: Image2,
        description: "School of Athens",
        link: "art_gallery/school_of_athens",
        artist: 'Raphael'
    },
    {
        img: Image1,
        description: "American Gothic",
        link: "art_gallery/american_gothic",
        artist: 'Grant Wood'
    },
    {
        img: Image3,
        description: "Nighthawks",
        link: "art_gallery/nighthawks",
        artist: "Edward Hopper"

    },
    {
        img: Image4,
        description: "The Death of Socrates",
        link: "art_gallery/death_of_socrates",
        artist: "Jacques-Louis David"
    },
    {
        img: Image5,
        description: "Girl with a Pearl Earring",
        link: "art_gallery/girl_with_a_pearl_earing",
        artist: "Johannes Vermeer"
    },
    {
        img: Image8,
        description: "Echo and Narcissus",
        link: "art_gallery/echo_and_narcissus",
        artist: "John William Waterhouse"
    },
    
    {
        img: Image6,
        description: "The Van Gogh",
        link: "art_gallery/the_van_gogh",
        artist: "John Russell"
    },
    
    {
        img: Image7,
        description: "Starry Nights",
        link: "art_gallery/starry_nights",
        artist: "Van Gogh"
    },
    {
        img: Image9,
        description: "The Persistence of Memory",
        link: "art_gallery/persistence_of_memory",
        artist: "Salvador Dalí"
    },
];

const contactConfig = {
    YOUR_EMAIL: "yashdarji23082004@gmail.com",
    YOUR_FONE: "+91 97272308XX",
    description: "This is our auto feedback form if you have found any bugs in the site please contact directly on email.",
    YOUR_SERVICE_ID: "service_gsuk1yv",
    YOUR_TEMPLATE_ID: "template_0ulklz5",
    YOUR_USER_ID: "hl_Odl7ESZ1V3Azv9",
};

const socialprofils = {
    github: "https://github.com/knowOne08",
    linkedin: "https://linkedin.com/in/yash-darji-6249a3255/",
    twitter: "https://twitter.com/know_one08",
};
export {
    meta,
    dataabout,
    paintings,
    introdata,
    contactConfig,
    socialprofils,
    logotext,
    poems,
    poetryQuotes,
};