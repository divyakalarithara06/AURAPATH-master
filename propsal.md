# Project Proposal

## Idea Summary
AuraPath is a safety-first navigation web application that prioritizes personal safety over speed. Instead of only suggesting the fastest route, the system compares multiple routes and calculates a Safety Score based on lighting levels, risk zones, and road types. The user can clearly see which route is safest and why.

## Target Users
- Women commuting at night
- Students returning home late
- Urban pedestrians concerned about safety
- General public in cities with safety concerns

## Feasibility Level
Level 4 – Hard (but shallow depth)
Challenging yet realistic within a 16-hour hackathon if scope is controlled.

## Core Features
1. Interactive web map with source and destination input.
2. Two route comparison: Fastest Route vs Safer Route.
3. Safety Score calculation using:
   - Mock streetlight density data
   - Simulated crime/risk heat zones
   - Road type weighting
4. Visual safety explanation panel (why one route is safer).

## Optional Features (If Time Allows)
- Safety meter gauge visualization.
- Toggle for “Night Mode” safety emphasis.
- Simple route risk breakdown chart.
- Basic UI personalization.

## Main Risks / Challenges
- Integrating map API correctly.
- Handling route comparison logic.
- Designing a clear Safety Score algorithm.
- Time management during implementation.

## Simplifications Applied
- No real crime or government data integration.
- No custom routing engine.
- No real-time crowd reporting.
- Web dashboard only (no mobile app).
- Simulated safety datasets for demo purposes.

## Final Scope Statement
AuraPath will be a web-based prototype demonstrating how safety-aware navigation can work using route comparison and simulated safety scoring. The goal is a visually impressive, functional demo that clearly communicates the concept, not a production-ready navigation system.
