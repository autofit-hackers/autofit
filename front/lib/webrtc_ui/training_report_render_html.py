from __future__ import annotations

from jinja2 import Environment, FileSystemLoader


def training_report_render_html(coaching_contents, training_report_template_path):

    environment = Environment(loader=FileSystemLoader("./"), trim_blocks=True, lstrip_blocks=True)

    template = environment.get_template(training_report_template_path)
    html = template.render(coaching_contents=coaching_contents)

    return html
