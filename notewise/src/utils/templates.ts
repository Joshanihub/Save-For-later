export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: string;
}

export const defaultTemplates: NoteTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Note',
    description: 'Start from scratch',
    icon: '📄',
    content: ''
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Capture agenda, attendees, and action items',
    icon: '🤝',
    content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n- \n\n## Action Items\n- [ ] '
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Reflect on your day',
    icon: '📓',
    content: '# Daily Journal\n\n## Intentions for Today\n- \n\n## What I accomplished\n- \n\n## What I learned\n- \n\n## Gratitude\n1. \n2. \n3. '
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'Outline goals and milestones',
    icon: '📋',
    content: '# Project Plan: [Project Name]\n\n## Objective\n\n\n## Milestones\n- [ ] Phase 1:\n- [ ] Phase 2:\n\n## Resources\n- '
  }
];
