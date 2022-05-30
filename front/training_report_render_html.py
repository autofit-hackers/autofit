from __future__ import annotations
from typing import Literal

from jinja2 import Environment, FileSystemLoader


def training_report_render_html(coaching_contents, template_jinja):

    environment = Environment(loader=FileSystemLoader("./"), trim_blocks=True, lstrip_blocks=True)

    template = environment.get_template(template_jinja)
    html = template.render(coaching_contents=coaching_contents)

    return html
