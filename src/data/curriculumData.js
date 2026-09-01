// src/data/curriculumData.js

// Username atau Nama Organisasi GitHub Mentor
export const MENTOR_ORG = "Ethereum-Jakarta";

export const CURRICULUM_DATA = [
  {
    phase: "Phase 0",
    title: "Programming Fundamentals",
    badge: "Basic JavaScript",
    description: "Fondasi logika pemrograman, variabel, pengkondisian, perulangan, array, dan objek dasar.",
    weeks: [
      { id: "p0-w1", name: "Week 1: Welcome to Code", repoName: "phase-0-week1-welcome-to-code", type: "single-file" },
      { id: "p0-w2", name: "Week 2: Array and Logic", repoName: "phase-0-week2-array-and-logic", type: "single-file" },
      { id: "p0-w3", name: "Week 3: Object is a Key", repoName: "phase-0-week3-object-is-a-key", type: "single-file" },
      { id: "p0-w4", name: "Week 4: Before the Journey", repoName: "phase-0-week4-before-the-journey", type: "single-file" },
      { id: "p0-prep", name: "Preparation", repoName: "phase-0-preparation", type: "single-file" },
      { id: "p0-quiz", name: "Basic Loop Quiz", repoName: "phase-0-basic-loop-quiz", type: "single-file" },
    ]
  },
  {
    phase: "Phase 1",
    title: "Backend Fundamental & Node.js",
    badge: "Node.js & Express API",
    description: "Pengembangan server backend, operasi asynchronous, Express.js RESTful API, dan database.",
    weeks: [
      { id: "p1-w1", name: "Week 1: Enhance Logic", repoName: "phase-1-week1-enhance-logic", type: "node-multi" },
      { id: "p1-w2", name: "Week 2: Backend Fundamental", repoName: "phase-1-week2-backend-fundamental", type: "node-multi" },
      { id: "p1-w3", name: "Week 3: Backend Database", repoName: "phase-1-week3-backend-database", type: "node-multi" },
      { id: "p1-w4", name: "Week 4: Backend API", repoName: "phase-1-week4-backend-api", type: "node-multi" },
      { id: "p1-w5", name: "Week 5: Backend Advanced", repoName: "phase-1-week5-backend-advanced", type: "node-multi" },
    ]
  },
  {
    phase: "Phase 2",
    title: "Frontend & Fullstack Engineering",
    badge: "ReactJS & Capstone",
    description: "Antarmuka modern dengan ReactJS, pengolahan state global, integrasi API, dan proyek kelompok.",
    weeks: [
      { id: "p2-w1", name: "Week 1: Frontend Basic", repoName: "phase-2-week1-frontend-basic", type: "frontend" },
      { id: "p2-w2", name: "Week 2: ReactJS", repoName: "phase-2-week2-reactjs", type: "frontend" },
      { id: "p2-w3", name: "Week 3: Frontend Advanced", repoName: "phase-2-week3-frontend-advanced", type: "frontend" },
      { id: "p2-w4", name: "Week 4: State and API", repoName: "phase-2-week4-state-api", type: "frontend" },
      { id: "p2-w5", name: "Week 5: Fullstack Capstone", repoName: "phase-2-week5-fullstack-capstone", type: "fullstack" },
      { id: "p2-w6", name: "Week 6: Group Capstone", repoName: "phase-2-week6-group-capstone", type: "fullstack" },
    ]
  }
];