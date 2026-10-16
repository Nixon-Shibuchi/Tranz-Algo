# Final report & presentation pack

Generated from the University of Zambia **2026** templates using as-built Tranz-Algo content and drawn diagrams.

| File | Description |
|---|---|
| [Tranz-Algo_Final_Year_Project_Report_2026_Nixon_Shibuchi.docx](./Tranz-Algo_Final_Year_Project_Report_2026_Nixon_Shibuchi.docx) | Individual report for Nixon (cover logos + Appendix A) |
| [Tranz-Algo_Final_Year_Project_Report_2026_Musonda_Katongo.docx](./Tranz-Algo_Final_Year_Project_Report_2026_Musonda_Katongo.docx) | Individual report for Musonda (cover logos + Appendix A) |
| [Tranz-Algo_Final_Year_Project_Presentation_2026.pptx](./Tranz-Algo_Final_Year_Project_Presentation_2026.pptx) | 16-slide deck (same order as UNZA template; diagrams fitted) |
| [figures/](./figures/) | Architecture, ERD, dual modes, True Cost workflow PNGs |

## What you submit

- **Each student submits only their own individual Word report** (Nixon or Musonda file above).
- There is **no joint report** for submission.
- The **shared Git repo** is listed on the cover, abstract note, Appendix A, and Appendix B:
  `https://github.com/Nixon-Shibuchi/Tranz-Algo`

## Print / grading notes

**Reports** (A4 hard copy): Times New Roman 12 pt body, 1.5 line spacing, black text,
larger headings, shaded table headers, page numbers, and high-DPI diagrams at ~6.1″ width.

**Presentation** (projector / handout): larger titles (~32 pt) and body (~20 pt), black text,
UNZA + Tranz-Algo logos on the title slide, high-DPI diagrams, repo URL on title + closing slides.
Open the PPTX in Slide Show once to confirm ERD / architecture stay readable at room distance.

## Before you submit

1. Computer numbers are set (Nixon `2021437361`, Musonda `2020583969`). Fill **supervisor name** in:
   - `build_report.py` (`SUPERVISOR`)
   - `build_presentation.py` (`SUPERVISOR`)
2. Confirm `REPO_URL` in `build_report.py` matches the public/shareable repo examiners should open.
3. Re-run the builders (below).
4. Skim the Word report for personal acknowledgements / signatures.
5. Rehearse the PPT with the live Demo A/B.

## Regenerate

```powershell
cd docs\report
..\..\backend\.venv\Scripts\python.exe build_report.py
..\..\backend\.venv\Scripts\python.exe build_presentation.py
```

Templates used (project root): `Final_Year_Project_Report_Template_2026.pdf`, `Presentation_Template_2026.pptx`.
