// Shared mock data for both visual directions.

const MOCK_CASE = {
  title: "Plaintiff A v. Karnataka State Industrial Areas Development Board & Anr.",
  shortTitle: "Plaintiff A v. KIADB & Anr.",
  court: "High Court of Karnataka",
  bench: "at Bengaluru",
  caseNo: "W.P. No. 23456/2024",
  cnr: "KAHC010012342024",
  type: "Writ Petition (Art. 226)",
  status: "active",
  filed: "14 March 2024",
  nextHearing: { date: "02 June 2026", relative: "in 5 days", bench: "Hon'ble Mr. Justice S.K., Single Bench" },
  parties: [
    { role: "Petitioner", name: "Plaintiff A", note: "represented by self / counsel" },
    { role: "Respondent No. 1", name: "State of Karnataka", note: "through Chief Secretary" },
    { role: "Respondent No. 2", name: "Karnataka State Industrial Areas Development Board", note: "through its Chief Executive Officer" },
  ],
  reliefs: "Quashing of acquisition notification dated 12 Jan 2024 issued under § 28(1) of the KIAD Act, 1966, and consequential relief.",
  facts: [
    { text: "Subject land bears Sy. No. 142/3, measuring 2 acres 14 guntas, at Village V, Taluk T.", confirmed: true, source: "Writ Petition, ¶ 4" },
    { text: "Petitioner acquired title by registered sale deed dated 18 May 2009.", confirmed: true, source: "Writ Petition, ¶ 6" },
    { text: "Acquisition notification under § 28(1) issued on 12 January 2024 for industrial purpose.", confirmed: true, source: "Annexure A-2" },
    { text: "Objections filed on 09 February 2024 remain undisposed.", confirmed: false, source: "Rejoinder, ¶ 11" },
    { text: "No award has been passed as on date.", confirmed: false, source: "Written Submissions, ¶ 3" },
  ],
  timeline: [
    { date: "14 Mar 2024", label: "Petition filed", kind: "filing", doc: "Writ Petition under Art. 226" },
    { date: "09 Apr 2024", label: "Notice issued; replies called for", kind: "order" },
    { date: "22 Jul 2024", label: "Counter-affidavit filed by R-1", kind: "filing", doc: "Counter Affidavit (R-1)" },
    { date: "11 Nov 2024", label: "Rejoinder filed by Petitioner", kind: "filing", doc: "Rejoinder Affidavit" },
    { date: "03 Feb 2025", label: "Arguments heard in part; matter part-heard", kind: "hearing" },
    { date: "27 Jan 2026", label: "Written submissions filed", kind: "filing", doc: "Written Submissions" },
    { date: "04 May 2026", label: "Application for early hearing filed", kind: "filing", doc: "Appl. for Early Hearing" },
    { date: "02 Jun 2026", label: "Listed for orders", kind: "upcoming" },
  ],
  documents: [
    { title: "Writ Petition under Art. 226", template: "Writ Petition (Art. 226)", date: "14 Mar 2024", pages: 28, drive: true },
    { title: "Memo of Caveat", template: "Caveat", date: "18 Mar 2024", pages: 4, drive: true },
    { title: "Rejoinder Affidavit", template: "Rejoinder", date: "11 Nov 2024", pages: 11, drive: true },
    { title: "Written Submissions", template: "Written Submissions", date: "27 Jan 2026", pages: 17, drive: true },
    { title: "Appl. for Early Hearing", template: "Misc. Application", date: "04 May 2026", pages: 3, drive: true },
  ],
};

const MOCK_TEMPLATE = {
  name: "Writ Petition under Article 226",
  docType: "writ_petition",
  version: "v3",
  updated: "11 May 2026",
  description: "For challenging acts or notifications of state authorities in the High Court of Karnataka. Refined from three filed petitions.",
  metrics: { generated: 14, cases: 9, lastUsed: "12 days ago" },
  fields: {
    basic: [
      { label: "Petitioner name", type: "text", placeholder: "e.g. Plaintiff A" },
      { label: "Petitioner address", type: "textarea", placeholder: "Door / Street / Locality / City / PIN" },
      { label: "Respondent(s)", type: "repeatable", placeholder: "Add one or more" },
      { label: "Impugned notification / order", type: "text", placeholder: "Citation + date" },
      { label: "Date of cause of action", type: "date" },
    ],
    prefill: [
      { label: "Court", type: "text", value: "High Court of Karnataka at Bengaluru", source: "profile" },
      { label: "Advocate (counsel)", type: "text", value: "Counsel C", source: "profile" },
      { label: "Advocate address", type: "textarea", value: "Chambers, Bar Association, Bengaluru — 560001", source: "profile" },
      { label: "Bar Council enrolment no.", type: "text", value: "KAR / 1234 / 2009", source: "profile" },
    ],
    caseSpecific: {
      label: "Grounds and prayer",
      hint: "The substantive content that varies case-to-case. Free text, can be long. Citations attached from Research will be available here.",
    },
  },
  references: [
    { kind: "learning_input", title: "Sample petition — Sy. 142 matter (2023)", note: "structure learnt from this filing" },
    { kind: "learning_input", title: "Sample petition — Indl. acquisition (2024)", note: "structure refined" },
    { kind: "standing_reference", title: "Karnataka HC Practice Circular 04/2022", note: "follow format prescribed for writ petitions" },
  ],
  linkedDocuments: [
    { title: "Writ Petition under Art. 226", case: "Plaintiff A v. KIADB & Anr.", date: "14 Mar 2024" },
    { title: "Writ Petition (land acquisition)", case: "Petitioner P v. State of Karnataka", date: "08 Jul 2024" },
    { title: "Writ Petition (service matter)", case: "Petitioner Q v. Union of India", date: "21 Aug 2024" },
    { title: "Writ Petition (Art. 226)", case: "Petitioner R v. BBMP & Ors.", date: "02 Oct 2024" },
    { title: "Writ Petition (zoning)", case: "Petitioner S v. BDA", date: "19 Dec 2024" },
    { title: "Writ Petition (Art. 226)", case: "Petitioner T v. State Excise", date: "30 Jan 2026" },
    { title: "Writ Petition (Art. 226)", case: "Petitioner U v. KPTCL", date: "11 May 2026" },
  ],
  history: [
    { date: "11 May 2026", label: "Standing reference added — HC Practice Circular 04/2022" },
    { date: "30 Jan 2026", label: "Structure refined from filing in Petitioner T matter" },
    { date: "02 Oct 2024", label: "Field added — Bar Council enrolment no. (prefill)" },
    { date: "14 Mar 2024", label: "Template created from 2 sample petitions" },
  ],
};

const MOCK_CASES = [
  { title: "Plaintiff A v. KIADB & Anr.", parties: { p: "Plaintiff A", r: "Karnataka State Industrial Areas Dev. Board" }, gist: "Challenge to a § 28(1) acquisition notification over 2 acres 14 guntas at Sy. 142/3. Reserved for orders.", court: "Karnataka HC", bench: "Bengaluru", caseNo: "W.P. No. 23456/2024", cnr: "KAHC010012342024", type: "Writ Petition", stage: "Reserved for orders", next: "02 Jun 2026", nextRel: "in 5 days", status: "active", docs: 5, facts: 9, unconfirmed: 2, pinned: true },
  { title: "State v. Accused B", parties: { p: "State of Karnataka", r: "Accused B" }, gist: "Defending the accused on charges under §§ 302, 34 IPC. Prosecution evidence closed; cross-examination ongoing.", court: "Sessions Court", bench: "Bengaluru Urban", caseNo: "S.C. No. 412/2025", cnr: "KASC020034122025", type: "Sessions Case", stage: "Cross-examination", next: "18 Jun 2026", nextRel: "in 3 weeks", status: "active", docs: 12, facts: 18, unconfirmed: 0 },
  { title: "Petitioner P v. State of Karnataka", parties: { p: "Petitioner P", r: "State of Karnataka & Anr." }, gist: "Land acquisition challenge — quantum and procedure disputed. Reply from State awaited.", court: "Karnataka HC", bench: "Bengaluru", caseNo: "W.P. No. 18904/2024", cnr: "KAHC010018902024", type: "Writ — Land Acq.", stage: "Reply awaited", next: "24 Jun 2026", nextRel: "in a month", status: "active", docs: 4, facts: 6, unconfirmed: 1 },
  { title: "M/s Trader X v. Bank Y", parties: { p: "M/s Trader X (Pvt.) Ltd.", r: "Bank Y" }, gist: "Cheque dishonour under § 138 N.I. Act for ₹14.2 lakh. Complainant's evidence being led.", court: "City Civil Court", bench: "Bengaluru", caseNo: "C.C. No. 8821/2025", cnr: "KACC030088212025", type: "§ 138 N.I. Act", stage: "Evidence", next: "11 Jul 2026", nextRel: "next month", status: "active", docs: 7, facts: 5, unconfirmed: 0 },
  { title: "Petitioner Q v. Union of India", parties: { p: "Petitioner Q", r: "Union of India" }, gist: "Service matter — challenge to denial of seniority on promotion. Arguments concluded; orders reserved.", court: "CAT — Bengaluru", bench: "Principal Bench", caseNo: "O.A. No. 304/2023", cnr: "KACT040003042023", type: "Service Matter", stage: "Reserved", next: "—", nextRel: "awaiting orders", status: "on_hold", docs: 9, facts: 12, unconfirmed: 0 },
  { title: "Decree Holder D v. Judgement Debtor", parties: { p: "Decree Holder D", r: "Judgement Debtor" }, gist: "Execution of a money decree of ₹4.6 lakh. Notice under Order XXI Rule 22 issued.", court: "City Civil Court", bench: "Bengaluru", caseNo: "E.P. No. 244/2025", cnr: "KACC030002442025", type: "Execution", stage: "Notice issued", next: "04 Jun 2026", nextRel: "in a week", status: "active", docs: 3, facts: 4, unconfirmed: 0 },
  { title: "Petitioner R v. BBMP", parties: { p: "Petitioner R", r: "Bruhat Bengaluru Mahanagara Palike" }, gist: "Challenge to property-tax reassessment. Arguments part-heard; rejoinder filed.", court: "Karnataka HC", bench: "Bengaluru", caseNo: "W.P. No. 31201/2024", cnr: "KAHC010031202024", type: "Writ Petition", stage: "Arguments part-heard", next: "30 Jun 2026", nextRel: "in a month", status: "active", docs: 6, facts: 7, unconfirmed: 2 },
  { title: "Petitioner T v. State Excise", parties: { p: "Petitioner T", r: "Karnataka State Excise" }, gist: "Writ challenging cancellation of a CL-2 licence. Disposed in March 2026.", court: "Karnataka HC", bench: "Bengaluru", caseNo: "W.P. No. 8812/2023", cnr: "KAHC010008812023", type: "Writ Petition", stage: "Disposed", next: "—", nextRel: "closed Mar 2026", status: "closed", docs: 11, facts: 14, unconfirmed: 0 },
  { title: "Petitioner U v. KPTCL", parties: { p: "Petitioner U", r: "Karnataka Power Transmission Corp." }, gist: "Tariff revision challenge on industrial connection. Counter-affidavit filed; arguments pending.", court: "Karnataka HC", bench: "Bengaluru", caseNo: "W.P. No. 9981/2026", cnr: "KAHC010099812026", type: "Writ Petition", stage: "Arguments pending", next: "14 Jul 2026", nextRel: "next month", status: "active", docs: 4, facts: 6, unconfirmed: 1 },
  { title: "Complainant V v. Accused W", parties: { p: "Complainant V", r: "Accused W" }, gist: "Private complaint under § 200 CrPC; cognisance taken under §§ 420, 406 IPC.", court: "Magistrate Court", bench: "Bengaluru (V)", caseNo: "P.C.R. No. 311/2025", cnr: "KAMC050003112025", type: "Private Complaint", stage: "Summons issued", next: "08 Jun 2026", nextRel: "in 11 days", status: "active", docs: 2, facts: 5, unconfirmed: 0 },
  { title: "Smt. M v. Sri N", parties: { p: "Smt. M", r: "Sri N" }, gist: "Petition under § 13(1)(i-a) HMA, 1955 for dissolution of marriage on the ground of cruelty.", court: "Family Court", bench: "Bengaluru", caseNo: "M.C. No. 7822/2025", cnr: "KAFC060078222025", type: "Matrimonial", stage: "Mediation referred", next: "22 Jun 2026", nextRel: "in 3 weeks", status: "active", docs: 6, facts: 9, unconfirmed: 1 },
  { title: "M/s Builder X v. Allottee Y", parties: { p: "M/s Builder X", r: "Allottee Y" }, gist: "RERA complaint over delay in handover; refund + interest sought under § 18.", court: "K-RERA", bench: "Bengaluru", caseNo: "CMP/UR/240914/0011", cnr: "—", type: "RERA Complaint", stage: "Reply filed", next: "27 Jun 2026", nextRel: "in a month", status: "active", docs: 5, facts: 7, unconfirmed: 0 },
  { title: "Petitioner Z v. State of Karnataka", parties: { p: "Petitioner Z", r: "State of Karnataka" }, gist: "Quashing petition under § 482 CrPC against FIR registered for §§ 420, 120-B IPC.", court: "Karnataka HC", bench: "Bengaluru", caseNo: "Crl.P. No. 4421/2025", cnr: "KAHC011044212025", type: "§ 482 CrPC", stage: "Notice issued", next: "06 Jul 2026", nextRel: "next month", status: "active", docs: 3, facts: 8, unconfirmed: 2 },
  { title: "Appellant A v. Respondent B", parties: { p: "Appellant A", r: "Respondent B" }, gist: "Regular First Appeal under § 96 CPC against decree in O.S. No. 1142/2021.", court: "Karnataka HC", bench: "Bengaluru", caseNo: "R.F.A. No. 209/2024", cnr: "KAHC012002092024", type: "Regular Appeal", stage: "Records called", next: "20 Jul 2026", nextRel: "in 2 months", status: "active", docs: 8, facts: 11, unconfirmed: 0 },
  { title: "Petitioner C v. Bar Council", parties: { p: "Petitioner C", r: "Bar Council of Karnataka" }, gist: "Disciplinary proceedings — challenge to show-cause notice under § 35 Advocates Act.", court: "Karnataka HC", bench: "Bengaluru", caseNo: "W.P. No. 28710/2024", cnr: "KAHC010287102024", type: "Writ Petition", stage: "Stay granted", next: "12 Aug 2026", nextRel: "in 2½ months", status: "on_hold", docs: 4, facts: 6, unconfirmed: 0 },
  { title: "Petitioner E v. State of Karnataka", parties: { p: "Petitioner E", r: "State of Karnataka" }, gist: "Bail application under § 439 CrPC in connection with Cr. No. 224/2025.", court: "Sessions Court", bench: "Bengaluru Urban", caseNo: "Crl.M. No. 1190/2026", cnr: "KASC020011902026", type: "Bail Application", stage: "Allowed (Jan 2026)", next: "—", nextRel: "closed Jan 2026", status: "closed", docs: 2, facts: 4, unconfirmed: 0 },
  { title: "Plaintiff F v. Defendant G", parties: { p: "Plaintiff F", r: "Defendant G" }, gist: "Suit for specific performance of an agreement to sell dated 12 Apr 2022.", court: "City Civil Court", bench: "Bengaluru", caseNo: "O.S. No. 6611/2024", cnr: "KACC030066112024", type: "Civil Suit", stage: "Issues framed", next: "16 Jun 2026", nextRel: "in 19 days", status: "active", docs: 9, facts: 13, unconfirmed: 1 },
  { title: "Petitioner H v. Commissioner of Income Tax", parties: { p: "Petitioner H", r: "Commissioner of Income Tax" }, gist: "Appeal against assessment order for A.Y. 2021-22 under § 250.", court: "ITAT", bench: "Bengaluru 'B' Bench", caseNo: "I.T.A. No. 318/2025", cnr: "—", type: "Tax Appeal", stage: "Stay petition pending", next: "09 Jul 2026", nextRel: "next month", status: "active", docs: 6, facts: 8, unconfirmed: 0 },
];

Object.assign(window, { MOCK_CASE, MOCK_TEMPLATE, MOCK_CASES });
