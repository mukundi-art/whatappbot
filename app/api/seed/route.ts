import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/seed — creates the demo "Spaza Shop Owner" course
// Only works in development or when ALLOW_SEED=true
export async function POST() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    return NextResponse.json({ error: 'Seeding disabled in production' }, { status: 403 })
  }

  const supabase = createServiceClient()

  // Create course
  const { data: course, error: ce } = await supabase
    .from('courses')
    .insert({
      title: 'Spaza Shop Owner Masterclass',
      description: 'Everything you need to run a profitable spaza shop — from stock management to customer service.',
      status: 'published',
    })
    .select()
    .single()

  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 })

  // Create module
  const { data: mod } = await supabase
    .from('modules')
    .insert({ course_id: course.id, title: 'Module 1: Managing Your Stock', sort_order: 0 })
    .select()
    .single()

  if (!mod) return NextResponse.json({ error: 'Module creation failed' }, { status: 500 })

  // Create lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .insert({
      module_id: mod.id,
      title: 'How to Count and Track Your Stock',
      source_text: 'Good stock management means knowing exactly what products you have in your shop, how much of each product you have, and when you need to order more.',
      sort_order: 0,
      status: 'published',
    })
    .select()
    .single()

  if (!lesson) return NextResponse.json({ error: 'Lesson creation failed' }, { status: 500 })

  // Create pre-generated content (English)
  await supabase.from('lesson_content').upsert({
    lesson_id: lesson.id,
    language: 'en',
    chat_script: [
      { id: '1', text: "Welcome to your first lesson! 👋 Today we're going to talk about something that can make or break your spaza shop — stock management.", delay: 1200 },
      { id: '2', text: "Stock management simply means keeping track of all the products in your shop. It's knowing what you have, how much you have, and when you need to buy more.", delay: 1500 },
      { id: '3', text: "Here's the thing — many spaza owners lose money not because their shop isn't busy, but because they run out of popular items or buy too much of things that don't sell.", delay: 1800 },
      { id: '4', text: "The fix? A simple stock counting system. Even a notebook and pen can work! The goal is to count your stock regularly — at least once a week.", delay: 1600 },
      { id: '5', text: "When you count your stock, write down: the product name, how many you have, and what the minimum number is before you must reorder. For example: Bread — 5 loaves — reorder when below 3.", delay: 2000 },
      { id: '6', text: "This small habit will help you never run out of your best-selling items AND stop you from wasting money on stock that just sits there. Let's test what you've learned! 🎯", delay: 1400 },
    ],
  }, { onConflict: 'lesson_id,language' })

  // English quiz
  await supabase.from('quizzes').upsert({
    lesson_id: lesson.id,
    language: 'en',
    questions: [
      {
        id: 'q1',
        question: "What does 'stock management' mean for a spaza shop owner?",
        options: [
          "Counting how many customers visit per day",
          "Keeping track of all products — what you have and when to reorder",
          "Managing your shop workers",
          "Counting your daily profits",
        ],
        correctIndex: 1,
        explanation: "Stock management means knowing what products you have, how much you have, and when to buy more — so you never run out or overbuy.",
      },
      {
        id: 'q2',
        question: "How often should you count your stock?",
        options: ["Once a year", "Only when you think you're running out", "At least once a week", "Every 3 months"],
        correctIndex: 2,
        explanation: "Counting stock at least once a week helps you spot problems early and always have your best-selling items available.",
      },
      {
        id: 'q3',
        question: "What should you write down when counting your stock?",
        options: [
          "Only the items that are running low",
          "Product name, quantity, and minimum reorder level",
          "The price of each product",
          "The date you last sold each item",
        ],
        correctIndex: 1,
        explanation: "Recording the product name, how many you have, and your reorder level gives you all the information you need to keep stock balanced.",
      },
      {
        id: 'q4',
        question: "Why do some spaza shops lose money even when they are busy?",
        options: [
          "They charge too little for products",
          "They don't have enough customers",
          "They run out of popular items or buy too much stock that doesn't sell",
          "Their shop location is bad",
        ],
        correctIndex: 2,
        explanation: "Running out of popular items means lost sales. Buying too much slow-moving stock wastes money. Good stock management prevents both problems.",
      },
    ],
  }, { onConflict: 'lesson_id,language' })

  // isiZulu content
  await supabase.from('lesson_content').upsert({
    lesson_id: lesson.id,
    language: 'zu',
    chat_script: [
      { id: '1', text: "Wamukelekile esifundweni sakho sokuqala! 👋 Namuhla sizokhuluma ngento ebalulekile kakhulu eznokwenza isitolo sakho siphumelele — ukuphatha izimpahla.", delay: 1200 },
      { id: '2', text: "Ukuphatha izimpahla kusho ukulandela zonke izimpahla ezisotoloeni sakho. Kusho ukwazi ukuthi unani, ingakanani, futhi nini udinga ukuthenga okuthe.", delay: 1500 },
      { id: '3', text: "Izitolo eziningi ziphulukana nemali kungekhona ngoba azinangcono, kodwa ngoba ziphela izimpahla eziyadayiswa noma zithenga kakhulu izimpahla ezingadayisi.", delay: 1800 },
      { id: '4', text: "Isisombululo? Indlela elula yokubalela izimpahla. Ngisho ibhukhu nepensela ziyasebenza! Inhloso ukubalela izimpahla zakho njalo — okungenani kanye ngesonto.", delay: 1600 },
      { id: '5', text: "Uma ubalela izimpahla zakho, bhala: igama lempahla, inani enalo, nenani elincane phambi kokudinga ukuthenga izinto ezintsha. Isibonelo: Isinkwa — amaqata angu-5 — thenga uma ephansi kwa-3.", delay: 2000 },
      { id: '6', text: "Lesi sijwayelo esincane sizokusiza ukuze ungapheli izimpahla eziyadayiswa futhi ungachithi imali ngeziimpahla ezingadingi. Ake sihlole ukufunda kwakho! 🎯", delay: 1400 },
    ],
  }, { onConflict: 'lesson_id,language' })

  // isiZulu quiz
  await supabase.from('quizzes').upsert({
    lesson_id: lesson.id,
    language: 'zu',
    questions: [
      {
        id: 'q1',
        question: "Ukuphatha izimpahla kusho ukuthini kumseshi wesitolo?",
        options: [
          "Ukubalela izimoto ezingena esitolo ngosuku",
          "Ukulandela zonke izimpahla — unani nokuthi nini udinga ukuthenga",
          "Ukulawula abasebenzi besitolo sakho",
          "Ukubalela inzuzo yakho yosuku",
        ],
        correctIndex: 1,
        explanation: "Ukuphatha izimpahla kusho ukwazi izimpahla onazyo, inani lazo, nokuthenga okunye — ukuze ungapheli noma uthenga kakhulu.",
      },
      {
        id: 'q2',
        question: "Kufanele ubalele izimpahla zakho kangaphi?",
        options: ["Kanye ngonyaka", "Uma ucabanga ukuthi uyaphela", "Okungenani kanye ngesonto", "Kanye ezinyangeni ezintathu"],
        correctIndex: 2,
        explanation: "Ukubalela izimpahla okungenani kanye ngesonto kukusiza ubone izinkinga zangaphambili futhi uhlale unezimpahla eziyadayiswa.",
      },
      {
        id: 'q3',
        question: "Kufanele ubhale ini uma ubalela izimpahla zakho?",
        options: [
          "Izimpahla eziphele kuphela",
          "Igama lempahla, inani, nenani elincane lokudinga ukuthenga",
          "Intengo yempahla nganye",
          "Usuku lokugcina ukudayisa impahla nganye",
        ],
        correctIndex: 1,
        explanation: "Ukubhala igama lempahla, inani onalo, nenani lakho lokudinga ukuthenga kukunika ulwazi lonke oludingeleka.",
      },
      {
        id: 'q4',
        question: "Kungani izitolo ezinye ziphulukana nemali ngisho zinabantu abaningi?",
        options: [
          "Zikhipha intengo ephansi kakhulu",
          "Azinabantu abanele",
          "Ziphela izimpahla eziyadayiswa noma zithenga kakhulu ezingadayisi",
          "Indawo yezitolo ayilungile",
        ],
        correctIndex: 2,
        explanation: "Ukuphela kwezimpahla eziyadayiswa kusho ukulahlekelwa. Ukuthenga kakhulu izimpahla ezisheshayo kushintsha imali. Ukuphatha izimpahla ngendlela kuvimbela izinkinga zombili.",
      },
    ],
  }, { onConflict: 'lesson_id,language' })

  return NextResponse.json({ success: true, course: { id: course.id, title: course.title } })
}
