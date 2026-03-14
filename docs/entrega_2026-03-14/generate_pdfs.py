from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


BASE_DIR = Path(__file__).resolve().parent

DOCS = [
    ("01_documentacion_tecnica.md", "01_documentacion_tecnica.pdf", "Documentacion Tecnica"),
    ("02_presentacion_alta_direccion.md", "02_presentacion_alta_direccion.pdf", "Presentacion Ejecutiva"),
    ("03_acta_entrega_formal.md", "03_acta_entrega_formal.pdf", "Entrega Formal de Plataforma"),
    ("04_manual_empleado.md", "04_manual_empleado.pdf", "Manual de Uso para Empleados"),
    ("05_manual_administrativo.md", "05_manual_administrativo.pdf", "Manual de Uso para Personal Administrativo"),
]


def build_styles():
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "CustomTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#004269"),
            alignment=TA_CENTER,
            spaceAfter=14,
        ),
        "h1": ParagraphStyle(
            "CustomH1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=colors.HexColor("#004269"),
            spaceBefore=10,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "CustomH2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#2f4f4f"),
            spaceBefore=8,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "CustomBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            alignment=TA_LEFT,
            spaceAfter=5,
        ),
        "bullet": ParagraphStyle(
            "CustomBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            leftIndent=14,
            firstLineIndent=-8,
            spaceAfter=4,
        ),
        "code": ParagraphStyle(
            "CustomCode",
            parent=styles["BodyText"],
            fontName="Courier",
            fontSize=8.2,
            leading=10.2,
            backColor=colors.HexColor("#f4f6f8"),
            borderPadding=6,
            borderColor=colors.HexColor("#d0d7de"),
            borderWidth=0.5,
            borderRadius=2,
            spaceAfter=6,
        ),
    }


def sanitize(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = text.replace("`", "")
    return text


def render_markdown_to_story(md_text: str, title: str):
    styles = build_styles()
    story = [Paragraph(sanitize(title), styles["title"]), Spacer(1, 0.3 * cm)]

    in_code = False
    code_buffer = []

    def flush_code():
        nonlocal code_buffer
        if code_buffer:
            story.append(Paragraph(sanitize("<br/>".join(code_buffer)), styles["code"]))
            story.append(Spacer(1, 0.1 * cm))
            code_buffer = []

    for raw_line in md_text.splitlines():
        line = raw_line.rstrip()

        if line.strip().startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_buffer.append(line if line else " ")
            continue

        if not line.strip():
            story.append(Spacer(1, 0.12 * cm))
            continue

        if line.startswith("# "):
            story.append(Paragraph(sanitize(line[2:].strip()), styles["h1"]))
            continue

        if line.startswith("## "):
            story.append(Paragraph(sanitize(line[3:].strip()), styles["h1"]))
            continue

        if line.startswith("### "):
            story.append(Paragraph(sanitize(line[4:].strip()), styles["h2"]))
            continue

        if line.startswith("- "):
            story.append(Paragraph(sanitize(f"• {line[2:].strip()}"), styles["bullet"]))
            continue

        if re.match(r"^\d+\.\s", line):
            story.append(Paragraph(sanitize(line), styles["bullet"]))
            continue

        story.append(Paragraph(sanitize(line), styles["body"]))

    flush_code()
    return story


def build_pdf(md_name: str, pdf_name: str, title: str):
    md_path = BASE_DIR / md_name
    pdf_path = BASE_DIR / pdf_name
    text = md_path.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=title,
        author="OpenAI Codex",
    )
    story = render_markdown_to_story(text, title)
    doc.build(story)


def main():
    for md_name, pdf_name, title in DOCS:
        build_pdf(md_name, pdf_name, title)
    print("PDFs generados correctamente.")


if __name__ == "__main__":
    main()
