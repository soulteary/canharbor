/* SPDX-License-Identifier: AGPL-3.0-or-later */
#include "canharbor.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main(int argc,char **argv) {
    uint64_t client=0,response=0;size_t needed=0;
    if(argc!=2||canharbor_abi_version()!=1)return 2;
    int code=canharbor_client_open((const uint8_t*)argv[1],strlen(argv[1]),&client);
    if(code)return code;
    const char *paths[]={"/version","/devices"};
    for(size_t i=0;i<2;i++) {
        code=canharbor_request(client,(const uint8_t*)"GET",3,(const uint8_t*)paths[i],strlen(paths[i]),NULL,0,NULL,0,&response);
        if(code)break;
        code=canharbor_response_status(response);if(code){canharbor_response_close(response);break;}
        int size_status=canharbor_response_copy(response,NULL,0,&needed);
        if(size_status!=CANHARBOR_LIMIT||needed==0||needed>1048576){code=9;canharbor_response_close(response);break;}
        uint8_t *bytes=malloc(needed);if(!bytes){code=8;canharbor_response_close(response);break;}
        code=canharbor_response_copy(response,bytes,needed,&needed);
        if(!code){fwrite(bytes,1,needed,stdout);fputc('\n',stdout);}
        free(bytes);canharbor_response_close(response);if(code)break;
    }
    canharbor_client_close(client);return code;
}
