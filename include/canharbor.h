/* SPDX-License-Identifier: AGPL-3.0-or-later */
#ifndef CANHARBOR_H
#define CANHARBOR_H
#include <stdint.h>
#include <stddef.h>
#ifdef __cplusplus
extern "C" {
#endif
/* ABI major 1. Handles are nonzero, opaque, process-local and never reused.
 * Byte strings are UTF-8 with explicit lengths, without trailing NUL.
 * All input/output pointers must address valid nonoverlapping memory for their
 * stated lengths. Nonempty inputs require non-NULL pointers. Output handle and
 * needed-length pointers are always required. A response copy with capacity 0
 * permits a NULL buffer and performs no request or other I/O.
 * Functions may be called from different threads. Concurrent close does not
 * cancel I/O already handed to the service. Never retry uncertain writes.
 */
enum canharbor_status {
    CANHARBOR_OK=0, CANHARBOR_INVALID=2, CANHARBOR_UNAVAILABLE=3,
    CANHARBOR_NOT_FOUND=4, CANHARBOR_CONFLICT=5, CANHARBOR_IO=6,
    CANHARBOR_OUTCOME_UNKNOWN=7, CANHARBOR_LIMIT=8, CANHARBOR_INTERNAL=9, CANHARBOR_AGAIN=10
};
uint32_t canharbor_abi_version(void);
int32_t canharbor_client_open(const uint8_t *directory, size_t length, uint64_t *client);
int32_t canharbor_client_close(uint64_t client);
/* Exactly one HTTP attempt. Returns an owned response handle, including API and
 * transport errors; inspect response_status and its JSON body, then release it.
 * Requests are bounded to 1 MiB JSON, 32 live clients, 64 response reservations,
 * and 4 queued calls per client. Queued work is cancelled on timeout/close.
 * A timed-out or lost response can mean outcome_unknown. A successful result
 * means only the API semantics described in the response, not CAN delivery.
 */
int32_t canharbor_request(uint64_t client,
    const uint8_t *method,size_t method_length,
    const uint8_t *path,size_t path_length,
    const uint8_t *json,size_t json_length,
    const uint8_t *generation,size_t generation_length,
    uint64_t *response);
/* Additive ABI 1 extension. query_json is an array of [key,value] UTF-8 string
 * pairs, at most 16 pairs and 4096 decoded UTF-8 bytes in total. An empty input
 * means no query. Values are URL encoded separately; path still forbids ?/#.
 */
int32_t canharbor_request_with_query(uint64_t client,
    const uint8_t *method,size_t method_length,
    const uint8_t *path,size_t path_length,
    const uint8_t *json,size_t json_length,
    const uint8_t *generation,size_t generation_length,
    const uint8_t *query_json,size_t query_length,
    uint64_t *response);
/* Stream a capture (at most 64 MiB) to an explicit absolute destination.
 * Creates a private temporary file, then publishes without replacing an existing
 * file. Returns an owned JSON response {"downloaded":true}, or an error response.
 * The ordinary queue, deadline and response limits apply. No CAN transmission.
 */
int32_t canharbor_capture_download(uint64_t client,
    const uint8_t *capture,size_t capture_length,
    const uint8_t *destination,size_t destination_length,uint64_t *response);
/* Read-only native observer subscription. At most 16 streams per process.
 * subscription_json uses the API Subscribe schema. No lease is acquired or
 * renewed. The parent client's close also stops its subscriptions.
 * next permits one concurrent reader and waits 1..1000 ms. AGAIN means idle,
 * with response=0; other completed reads return an owned JSON response handle.
 * Responses include hello/events/gap/fault; callers must inspect stream messages.
 * No automatic reconnect. close interrupts a pending next; never resumes TX.
 */
int32_t canharbor_stream_open(uint64_t client,
    const uint8_t *session,size_t session_length,
    const uint8_t *subscription_json,size_t subscription_length,uint64_t *stream);
int32_t canharbor_stream_next(uint64_t stream,uint32_t timeout_ms,uint64_t *response);
int32_t canharbor_stream_close(uint64_t stream);
int32_t canharbor_response_status(uint64_t response);
int32_t canharbor_response_copy(uint64_t response,uint8_t *buffer,size_t capacity,size_t *needed);
int32_t canharbor_response_close(uint64_t response);
#ifdef __cplusplus
}
#endif
#endif
