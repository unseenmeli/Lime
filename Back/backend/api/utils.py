import os
import re
from django.http import HttpResponse, HttpResponseNotModified, HttpResponseBadRequest
from django.utils.http import http_date
from wsgiref.util import FileWrapper


def serve_audio_with_range(request, file_path):
    if not os.path.exists(file_path):
        return HttpResponseBadRequest("File not found")

    file_size = os.path.getsize(file_path)
    range_header = request.META.get('HTTP_RANGE', '').strip()
    range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)

    if range_match:
        start = int(range_match.group(1))
        end = int(range_match.group(2)) if range_match.group(2) else file_size - 1

        if start >= file_size or end >= file_size:
            return HttpResponseBadRequest("Requested range not satisfiable")

        length = end - start + 1

        with open(file_path, 'rb') as f:
            f.seek(start)
            data = f.read(length)

        response = HttpResponse(data, status=206, content_type='audio/mpeg')
        response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
        response['Accept-Ranges'] = 'bytes'
        response['Content-Length'] = str(length)
    else:
        with open(file_path, 'rb') as f:
            wrapper = FileWrapper(f)
            response = HttpResponse(wrapper, content_type='audio/mpeg')
            response['Content-Length'] = str(file_size)
            response['Accept-Ranges'] = 'bytes'

    response['Cache-Control'] = 'public, max-age=3600'
    return response