AuraPath 🎯
Basic Details

Team Name: Innotech

Team Members

Member 1: Divya Antony – Saintgits College Of Engineering
Member 2: Erin Maria Elson – Saintgits College Of Engineering

Hosted Project Link

(https://delightful-kringle-8c2dd1.netlify.app/)

Project Description

AuraPath is a safety-first navigation web application that prioritizes personal safety over speed. Instead of suggesting only the fastest route, it compares multiple routes and calculates a Safety Score using simulated lighting density, risk zones, and road types. The system visually explains why one route is safer, making safety transparent, data-driven, and user-focused.

The Problem Statement

Traditional navigation systems optimize for speed and shortest distance but ignore critical personal safety factors such as poorly lit streets, high-risk zones, and unsafe road types. This creates a serious gap for women, students, and pedestrians commuting at night who need safer route recommendations rather than just the fastest path.

The Solution

AuraPath introduces a Safety-Aware Navigation Model that evaluates routes based not only on time but also on safety parameters.

The system:

Compares the Fastest Route vs The Safer Route

Assigns a Dynamic Safety Score

Highlights risk factors visually

Provides a transparent explanation of route safety

Safety Score is calculated using:

Simulated Streetlight Density Data

Mock Risk / Crime Heat Zones

Road Type Weighting

Users can clearly see which route is safer and understand why it is recommended.

Technical Details
Technologies / Components Used
For Software

Languages Used:

JavaScript

HTML

CSS

Frameworks Used:

React / Next.js (Adjust Based On Your Stack)

Libraries Used:

Map API (Mapbox / Google Maps API)

Axios (If Used For Data Handling)

Tools Used:

VS Code

Git & GitHub

Antigravity Development Environment

Browser Developer Tools

Features
Feature 1: Route Comparison System

Displays Fastest Route vs Safer Route with clear visual distinction and intelligent highlighting.

Feature 2: Dynamic Safety Score Algorithm

Calculates a route-based safety score using simulated safety datasets and route characteristics.

Feature 3: Safety Explanation Panel

Expandable section explaining why a route is safer (lighting percentage, avoided risk zones, safer road types).

Feature 4: Interactive UI Enhancements

Animated Safety Meter, Night Safety Mode Toggle, Emergency Assist Demo Button, Micro-Animations, And Toast Notifications.

Implementation
For Software
Installation
npm install

Run
npm run dev


Or

npm start

Project Documentation
S

![screen shot 1] (https://i.postimg.cc/SKv6L1PC/Screenshot-2026-02-15-091708.png)

![screen shot 2] (https://i.postimg.cc/prNK4hRd/Screenshot-2026-02-15-092134.png)

![screen shot 3] (https://i.postimg.cc/5yc8TYbV/Screenshot-2026-02-15-092731.png)

![screen shot 4] (https://i.postimg.cc/brX1WDpf/Screenshot-2026-02-15-092806.png)

![screen shot 5] (https://i.postimg.cc/85fhZB80/Screenshot-2026-02-15-092829.png)

![screen shot 6] (https://i.postimg.cc/zvmT6b5x/Screenshot-2026-02-15-092844.png)



Diagrams
System Architecture

Architecture Explanation:

User Enters Source And Destination

Map API Fetches Multiple Route Options

Safety Scoring Engine Evaluates Each Route Using Simulated Datasets

UI Visualization Layer Displays Comparison

User Selects Preferred Route

Data Flow:
User Input → Route API → Safety Scoring Module → UI Visualization Layer

Application Workflow

User Enters Source And Destination

System Fetches Multiple Route Options

Safety Score Is Calculated For Each Route

Safer Route Is Highlighted

User Reviews Safety Explanation Panel

User Selects Route

Final Scope Statement

AuraPath is a Web-Based Prototype Demonstrating How Safety-Aware Navigation Can Work Using Route Comparison And Simulated Safety Scoring. The goal is to present a Visually Impressive, Functional, And Conceptually Strong Demo That Clearly Communicates Social Impact And Technical Feasibility — not a production-ready navigation system.
