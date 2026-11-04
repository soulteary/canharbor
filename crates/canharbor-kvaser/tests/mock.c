/* SPDX-License-Identifier: AGPL-3.0-or-later */
#include "KvaserUSB.h"
#include <stddef.h>
#include <string.h>
#include <stdlib.h>
static int opened[2], queued[2], mode[2], rate[2], fd[2], fail, off[2], closes, writes;
static unsigned queries[3];
unsigned mock_queries(unsigned i){return queries[i];}
static kv_msg messages[2], last;
static int index_of(uint32_t h){return h==0x10200?0:h==0x10201?1:-1;}
void mock_reset(void){memset(opened,0,sizeof(opened));memset(queued,0,sizeof(queued));memset(off,0,sizeof(off));fail=closes=writes=0;memset(queries,0,sizeof(queries));}
void mock_fail(int code){fail=code;}
int mock_count(int kind){return kind?closes:writes;}
void mock_frame(unsigned h,unsigned flags,unsigned dlc,unsigned len){int k=index_of(h);memset(&messages[k],0,sizeof(kv_msg));messages[k].id=0x654;messages[k].flags=flags;messages[k].dlc=dlc;messages[k].len=len;messages[k].ts_us=0x123456789ULL;for(unsigned i=0;i<64;i++)messages[k].data[i]=i;queued[k]=1;}
void mock_busoff(unsigned h){off[index_of(h)]=1;}
unsigned mock_last(unsigned field){return field==0?last.flags:field==1?last.dlc:last.len;}
size_t mock_size(unsigned kind){return kind==0?sizeof(kv_channel_info):kind==1?sizeof(kv_msg):sizeof(kv_open_opts);}
size_t mock_offset(unsigned kind){return kind==0?offsetof(kv_channel_info,serial):kind==1?offsetof(kv_msg,data):offsetof(kv_msg,ts_us);}
const char *kv_library_version(void){return "1.0.2";}
int kv_scan(kv_channel_info *out,int max){if(max<2)return KV_ERR_PARAM;memset(out,0,2*sizeof(*out));for(int i=0;i<2;i++){out[i].handle=0x10200+i;memcpy(out[i].name,"Synthetic Kvaser",17);memcpy(out[i].product,"Synthetic",10);out[i].pid=42;out[i].channel=i;out[i].channel_count=2;out[i].fd_capable=i;out[i].available=!opened[i];}return 2;}
int kv_open(uint32_t h,const kv_open_opts *o){int k=index_of(h);if(k<0)return KV_ERR_NO_DEVICE;if(opened[k])return KV_ERR_BUSY;if(fail==-2)return fail;if(k==0&&o->can_fd)return KV_ERR_PARAM;opened[k]=1;mode[k]=o->listen_only;rate[k]=o->bitrate;fd[k]=o->can_fd;if(getenv("CANHARBOR_KVASER_TEST_RX"))mock_frame(h,0,2,2);return 0;}
void kv_close(uint32_t h){int k=index_of(h);if(k>=0&&opened[k]){closes++;opened[k]=0;queued[k]=0;}}
int kv_get_driver_mode(uint32_t h,int *out){queries[1]++;int k=index_of(h);if(k==0)return KV_ERR_PARAM;*out=fail==1?!mode[k]:mode[k];return 0;}
int kv_get_busparams(uint32_t h,int *out,int *a,int *b,int *c){queries[0]++;(void)a;(void)b;(void)c;*out=fail==2?125000:rate[index_of(h)];return 0;}
int kv_capabilities(uint32_t h,uint32_t *out){queries[2]++;*out=index_of(h)==1?KV_CAP_CAN_FD:0;return 0;}
int kv_write(uint32_t h,const kv_msg *m){int k=index_of(h);if(k<0||!opened[k])return KV_ERR_NOT_OPEN;if(mode[k])return KV_ERR_PARAM;if(fail<0)return fail;if((m->flags&KV_FLAG_RTR)&&m->len!=m->dlc)return KV_ERR_PARAM;last=*m;writes++;return 0;}
int kv_read(uint32_t h,kv_msg *m){int k=index_of(h);if(k<0||!opened[k])return KV_ERR_NOT_OPEN;if(!queued[k])return KV_ERR_EMPTY;*m=messages[k];queued[k]=0;return 0;}
int kv_status(uint32_t h,int *busoff,uint8_t *tec,uint8_t *rec){*busoff=off[index_of(h)];*tec=0;*rec=0;return 0;}
