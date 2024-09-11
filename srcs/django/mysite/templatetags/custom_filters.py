from django import template

register = template.Library()

@register.filter(name='format_phone')
def format_phone(value):
    return ' '.join([value[i:i+2] for i in range(0, len(value), 2)])