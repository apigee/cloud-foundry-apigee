/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 retrieve forwarded url from header,
 save for use in target flow to set target url.
 additionally parse url into components and set
 request.uri to allow path/queryparam variable
 references to work as expected
*/
var cfurl = context.getVariable('request.header.X-Cf-Forwarded-Url')
// TODO: update this if/when route services change made on CF side
// var cfurl = context.getVariable('proxy.pathsuffix')
// cfurl = decodeURIComponent(cfurl.slice(1))
// TODO: Update zip file

context.setVariable('cf-url', cfurl)

var r = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/
var parts = r.exec(cfurl)
context.setVariable('cf-path', parts[5])
if (parts[6]) {
    context.setVariable('cf-querystring', parts[6])
    context.setVariable('request.uri', parts[5] + parts[6])
} else {
    context.setVariable('request.uri', parts[5])
}
