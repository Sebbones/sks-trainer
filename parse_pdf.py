import pymupdf
import re
import json

file_path = "./questions.pdf"

doc = pymupdf.open(file_path)
pages = [ page.get_text(sort=True) for page in doc ]

nav_questions_pages = pages[6:23]
legal_questions = pages[24:44]
weather_questions = pages[44:57]
crew1_questions = pages[57:83]
crew2_questions = pages[84:110]

def merge_lines(lines: list[str]):
  text = "\n".join(lines).strip("\n")
  text = re.sub(r'-\n', "", text)
  text = re.sub(r'(?<!\d\.)\n(?!\d)', " ", text)
  text = text.strip(" ")
  return text

def extract_questions(page: str):
  chunks = re.split("\n\n", page)
  questions: list[tuple[str, str]] = []

  for chunk in chunks:
    nr_match = re.match("^Nr. (\\d*)", chunk, flags=re.MULTILINE)
    if nr_match is None:
      continue

    nr = nr_match.groups()[0]

    span = nr_match.span()
    chunk_text = chunk[span[1]:]

    question_parts: list[str] = []
    answer_parts: list[str] = []

    for line in chunk_text.splitlines():
      parts = re.split(" {2,}", line)[-2:]
      if len(parts) == 0:
        continue
      elif len(parts) == 1:
        question_parts.append(parts[0])
      elif len(parts) == 2:
        question_parts.append(parts[0])
        answer_parts.append(parts[1])
      else:
        raise Exception(f"Too many parts in line: {line}")
    
    questions.append([nr, merge_lines(question_parts), merge_lines(answer_parts)])
   
  return questions

id = 0

def flatten_questions(questions: list, type: str):
  global id
  flat = []
  for page_questions in questions:

    if type == "weather":
      page_questions.append([
        "34",
        """Um welche Arten von Fronten handelt es sich in der Abbildung, die mit 1, 2 und 3 bezeichnet sind? <img src="/imgs/weather_34_1.png" />""",
        """
  1.Okklusionsfront (Tiefausläufer).
  2.Warmfront.
  3.Kaltfront.
  """
      ])

    for (i, question) in enumerate(page_questions):
      if type == "nav" and question[0] == "30" and "ff." in question[1]:
        for f in flat:
          if f[1] == question[0]:
            f[2] = f[2] + "\n" + question[1]
            f[3] = f[3] + "\n" + question[2]
            break
        continue
      elif type == "legal":
        if question[0] == "95" and "ff." in question[1]:
          for f in flat:
            if f[1] == question[0]:
              f[2] = f[2] + "\n" + question[1]
              f[3] = f[3] + "\n" + question[2]
              break
          continue
        if question[0] == "21":
          question[1] = """
  Sie sehen ein Fahrzeug 
  mit folgender 
  Lichterführung:
  <img src="/imgs/legal_21_1.png" />
  1. Worum handelt es sich? 
  2. Welches Schallsignal müsste dieses
  Fahrzeug bei unsichtigem Wetter geben?
          """
        elif question[0] == "22":
          question[1] = """
  Sie sehen nachts auf See 2 rote
  Lichter senkrecht übereinander: 
  Worum handelt es sich?
  <img src="/imgs/legal_22_1.png" />
          """
        elif question[0] == "23":
          question[1] = """
  Die Lichteranordnung eines Fahrzeugs ändert sich plötzlich 
  <img src="/imgs/legal_23_1.png" />
  Was schließen Sie daraus?
          """
        elif question[0] == "49":
          question[1] = """
  Auf einer Motoryacht A erkennt man nachts
  etwa 2 Strich an Bb. folgende Lichter des
  Fahrzeugs B, die rasch näher kommen.
  <img src="/imgs/legal_49_1.png" />
  Die Kompasspeilung zum Fahrzeug B änderts
  ich dabei nur geringfügig.
  1. Worum handelt es sich bei Fahrzeug B? 
  2. Wer muss ausweichen?
  3. Was muss Fahrzeug A tun?
          """
        elif question[0] == "51":
          question[1] = """
  Auf einer Motoryacht A sieht man nachts etwa
  querab an Stb. ein einzelnes weißes Licht in
  (nahezu) stehender Kompasspeilung. Näher
  kommend erkennt man unterhalb des weißen
  Lichtes und etwas rechts davon ein rotes Licht
  (Fahrzeug B).
  <img src="/imgs/legal_51_1.png" />
  1. Worum handelt es sich? 
  2. Was müssen jeweils beide Fahrzeuge tun?
  (Begründung!)
          """
        elif question[0] == "77":
          question[1] = """
  Sie sehen auf der Elbe bei Nacht ein Fahrzeug
  mit der nachfolgenden Lichterführung. Um
  was für ein Fahrzeug handelt es sich? Was
  bedeuten die beiden roten und die beiden grünen Lichter senkrecht übereinander?
  <img src="/imgs/legal_77_1.png" />
  1. Worum handelt es sich? 
  2. Was müssen jeweils beide Fahrzeuge tun?
  (Begründung!)
          """
        elif question[0] == "78":
          question[1] = """
  Sie sehen auf der Elbe bei Tage ein Fahrzeug
  mit den nachfolgenden schwarzen Signalkörpern, dessen Bugwelle man klar erkennen
  kann. Um was für ein Fahrzeug handelt es
  sich? Was bedeuten die beiden schwarzen
  Bälle und die beiden schwarzen Rhomben
  senkrecht übereinander?
  <img src="/imgs/legal_78_1.png" />
          """
        elif question[0] == "78":
          question[1] = """
  Während einer Revierfahrt erkennen Sie ein
  Signal an Land, jeweils schwarze Signalkörper:
  <img src="/imgs/legal_82_1.png" />
  1. Was bedeutet dieses Signal? 
  2. Welches Signal wird stattdessen nachts
  gezeigt?
          """
      elif type == "weather":
        if question[0] == "33":
          question[1] = """
  Welche Windrichtungen erwarten Sie an den
  Punkten 1, 2, 3, 4, 5 eines Tiefdruckgebiets auf
  der Nordhalbkugel?
  <img src="/imgs/weather_33_1.png" />
  """
          question[2] = """
1.Nordost.
2.Süd.
3.Südwest.
4.Nordwest.
5.Umlaufender Wind.
"""
      elif type == "crew_1":
        if question[0] == "41":
          question[1] = """
  Erklären Sie mit Hilfe eines Vektor
  parallelogramms aus „wahrem Wind (wW)“, 
  „Fahrtwind (Fw)“ und „scheinbarem Wind
  (sW)“, warum beim Einfallen einer Bö (Wind
  zunahme) der „scheinbare Wind“ raumt. 
  Welcher Vorteil ergibt sich dadurch beim 
  Kreuzen?
  (Zeichnung!)
  """
          question[2] = """
  <img src="/imgs/crew_1_41_1.png" />
  Verhältnisse vor Einfall der Bö
  <img src="/imgs/crew_1_41_2.png" />
  Verhältnisse bei 
   Einfall der Bö:
  Der „scheinbare Wind“
   fällt etwas achterlicher
   ein, er „raumt“, und
   das Segelboot kann
   etwas höher an den
   „wahren Wind“ gehen.
  """
        elif question[0] == "78":
          question[1] = """
  Wie sind längsseits liegende Fahrzeuge fest zumachen? Ergänzen Sie die Skizze und benennen Sie die Leinen.
  <img src="/imgs/crew_1_78_1.png" />
  """
          question[2] = """
  1. Achterleine,
  2. Achterspring,
  3. Vorspring,
  4. Vorleine.
  <img src="/imgs/crew_1_78_2.png" />
  """
        elif question[0] == "79":
          question[1] = """
  Wie können Sie mit Hilfe von zwei Fendern und einem Fenderbrett Ihr Boot festmachen, wenn die Pier mit vorspringenden Pfählen versehen ist? Ergänzen Sie die Skizze mit Leinen. 
  <img src="/imgs/crew_1_79_1.png" />
  """
          question[2] = """
  <img src="/imgs/crew_1_79_1.png" />
  """
        elif question[0] == "104":
          question[1] = """
  Mit welchem Manöver können Sie bei Starkwind das Halsen vermeiden (Name)? 
  Vervollständigen Sie die Skizze durch Einzeichnen der Kurslinie und geben Sie die erforderlichen Manöver an.
  <img src="/imgs/crew_1_104_1.png" />
  """
          question[2] = """
  <img src="/imgs/crew_1_104_2.png" />
  """
      id += 1
      flat.append([id, *question])
  return flat

sets = {
  "nav": flatten_questions([ extract_questions(page) for page in nav_questions_pages ], "nav"),
  "legal": flatten_questions([ extract_questions(page) for page in legal_questions ], "legal"),
  "weather": flatten_questions([ extract_questions(page) for page in weather_questions ], "weather"),
  "crew_1": flatten_questions([ extract_questions(page) for page in crew1_questions ], "crew_1"),
  "crew_2": flatten_questions([extract_questions(page) for page in crew2_questions], "crew_2"),
}

with open("./frontend/src/assets/questions.json", "w", encoding='utf-8') as fd:
  json.dump(sets, fd, indent=2)

# TODO: Automatically fix nav 30 and legal 95